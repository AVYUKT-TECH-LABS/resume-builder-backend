import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResumeV2 } from '../schemas/resume.schema.v2';
import { Model, Types } from 'mongoose';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobEmbeddings } from '../schemas/job-embeddings.schema';
import { z } from 'zod';

@Injectable()
export class CandidatesDatabaseService {
  private logger: Logger = new Logger(CandidatesDatabaseService.name);
  constructor(
    @InjectModel(ResumeV2.name) private resumeModel: Model<ResumeV2>,
    private openai: OpenAiService,
    private prisma: PrismaService,
    @InjectModel(JobEmbeddings.name)
    private jobEmbeddingsModel: Model<JobEmbeddings>,
  ) {}

  async getRecommendedCandidatesForJob(
    jobId: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    try {
      //get saved embeddings for the job
      const job = await this.jobEmbeddingsModel.findOne({
        jobId,
      });

      //Do a vector search
      const vectorResponse = await this.vectorSearch(
        job.embeddings,
        page,
        pageSize,
      );

      const recommendedCandidates = await this.getUserDetails(
        vectorResponse.results,
      );

      return {
        results: recommendedCandidates,
        pagination: vectorResponse.pagination,
      };
    } catch (err) {
      this.logger.log('Failed to get recommended candidates', err);
      throw err;
    }
  }

  async search(query: string, page: number = 1, pageSize: number = 10) {
    try {
      //generate embeddings for the query
      const embeddings = await this.openai.generateEmbeddings(query);

      //Do a vector search
      const vectorResponse = await this.vectorSearch(
        embeddings,
        page,
        pageSize,
      );

      const candidates = await this.getUserDetails(vectorResponse.results);

      return {
        results: candidates,
        pagination: vectorResponse.pagination,
      };
    } catch (err) {
      this.logger.log('Failed to search candidates', err);
      throw err;
    }
  }

  async getScore(userId: string, resumeId: string, jobId: string) {
    try {
      //get saved embeddings for the job
      const job = await this.jobEmbeddingsModel.findOne({
        jobId,
      });

      //Do a vector search
      const { results: applicationScores } = await this.vectorSearch(
        job.embeddings,
        1,
        1,
        {
          userId,
          _id: new Types.ObjectId(resumeId),
        },
      );

      return applicationScores;
    } catch (err) {
      this.logger.log('Failed to search candidates', err);
      throw err;
    }
  }

  private async getUserDetails(
    data: { _id: string; userId: string; score: number }[],
  ) {
    const userIds = data.map((item) => item.userId);
    const resumeIds = data.map((item) => item._id);

    try {
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
          banned: false,
          locked: false,
        },
        select: {
          hasImage: true,
          imageUrl: true,
          id: true,
          name: true,
        },
      });

      const userMap = users.reduce(
        (acc, user) => {
          acc[user.id] = user;
          return acc;
        },
        {} as Record<string, any>,
      );

      const resumes = await this.resumeModel.find(
        {
          _id: {
            $in: resumeIds,
          },
        },
        {
          _id: 1,
          'sections.summary': 1,
          'sections.skills': 1,
        },
      );

      const resumeMap = resumes.reduce(
        (acc, resume) => {
          acc[resume._id.toString()] = resume;
          return acc;
        },
        {} as Record<string, any>,
      );

      // const sampleUser = {
      //   name: 'S. W.',
      //   avatar: '/placeholder.svg?height=40&width=40',
      //   experience: '8 years',
      //   description:
      //     'Led K-7 curriculum innovation and improvement at Ubuntu Pathways.',
      //   expertise: ['Data Analysis', 'Team Collaboration', 'Leadership'],
      //   commitment: 'Full-time',
      // };

      const result = data.map((item) => ({
        ...item,
        user: userMap[item.userId] || null,
        // user: sampleUser,
        resume: resumeMap[item._id] || null,
      }));

      return result;
    } catch (error) {
      console.error('Error fetching users: ', error);
      throw error;
    }
  }

  async summary(resumeId: string, query: string) {
    const resume = await this.resumeModel.findById(resumeId, {
      plainText: 1,
    });
    const generatedSummary = await this.openai.generateResponse(
      'You are given a resume in plain text along with a query, your task is to return a brief summary of weather the resume matches the query or not.',
      `
      query: ${query}

      input: ${resume.plainText}
      `,
      {
        name: 'summary-formatter',
        schema: z.object({
          summary: z
            .string()
            .describe('Your analysis. Keep this well within 100 characters'),
        }),
      },
    );

    return generatedSummary;
  }

  async vectorSearch(
    embeddings: number[],
    page: number = 1,
    pageSize: number = 10,
    matchQuery?: Record<string, any>,
  ) {
    const aggregationPipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embeddings',
          queryVector: embeddings,
          limit: Math.min(Math.max(pageSize * page, 1000), 5000),
          numCandidates: Math.min(Math.max(pageSize * page * 2, 2000), 10000),
        },
      },
    ];

    if (matchQuery) {
      aggregationPipeline.push({
        $match: matchQuery,
      });
    }

    aggregationPipeline.push(
      {
        $sort: {
          score: -1,
        },
      },
      {
        $group: {
          _id: '$userId',
          topMatch: { $first: '$$ROOT' },
          score: { $first: { $meta: 'vectorSearchScore' } },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$topMatch',
              {
                score: {
                  $round: [{ $multiply: ['$score', 100] }, 0],
                },
              },
            ],
          },
        },
      },
      {
        $sort: {
          score: -1, // Sort again to get the overall top matches
        },
      },
    );

    // Execute the aggregation pipeline to get the total count
    const countResult = await this.resumeModel.aggregate(
      aggregationPipeline.concat([{ $count: 'totalCount' }]),
    );

    const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

    // Execute the aggregation pipeline with pagination
    const results = await this.resumeModel.aggregate(
      aggregationPipeline.concat([
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            score: 1,
          },
        },
      ]),
    );

    return {
      results,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}
