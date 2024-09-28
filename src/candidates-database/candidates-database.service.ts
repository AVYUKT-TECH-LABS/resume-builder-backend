import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResumeV2 } from '../schemas/resume.schema.v2';
import { Model } from 'mongoose';
import { OpenAiService } from '../openai/openai.service';

@Injectable()
export class CandidatesDatabaseService {
  private logger: Logger = new Logger(CandidatesDatabaseService.name);
  private prisma: any;
  constructor(
    @InjectModel(ResumeV2.name) private resumeModel: Model<ResumeV2>,
    private openai: OpenAiService,
  ) {}

  async getRecommendedCandidatesForJob(
    jobId: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    try {
      //get saved embeddings for the job
      const job = await this.prisma.job.findUnique({
        where: {
          _id: jobId,
        },
        select: {
          embeddings: true,
        },
      });

      const embeddings: number[] = JSON.parse(job.embeddings);

      //Do a vector search
      const vectorResponse = await this.vectorSearch(
        embeddings,
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
      const job = await this.prisma.job.findUnique({
        where: {
          _id: jobId,
        },
        select: {
          embeddings: true,
        },
      });

      const embeddings: number[] = JSON.parse(job.embeddings);

      //Do a vector search
      const { results: applicationScores } = await this.vectorSearch(
        embeddings,
        1,
        1,
        {
          userId,
          _id: resumeId,
        },
      );

      return applicationScores[0].score;
    } catch (err) {
      this.logger.log('Failed to search candidates', err);
      throw err;
    }
  }

  private async getUserDetails(
    data: { _id: string; userId: string; score: number }[],
  ) {
    const userIds = data.map((item) => item.userId);

    try {
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      const userMap = users.reduce(
        (acc, user) => {
          acc[user.id] = user;
          return acc;
        },
        {} as Record<string, any>,
      );

      const result = data.map((item) => ({
        ...item,
        user: userMap[item.userId] || null,
      }));

      return result;
    } catch (error) {
      console.error('Error fetching users: ', error);
      throw error;
    }
  }

  async vectorSearch(
    embeddings: number[],
    page: number = 1,
    pageSize: number = 10,
    matchQuery?: Record<string, any>,
  ) {
    const aggregationPipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embeddings',
          queryVector: embeddings,
          limit: Math.min(Math.max(pageSize * page, 1000), 5000),
          numCandidates: Math.min(Math.max(pageSize * page * 2, 2000), 10000),
        },
      },
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
    ];

    if (matchQuery)
      aggregationPipeline.push({
        $match: matchQuery,
      } as never);

    // Execute the aggregation pipeline to get the total count
    const countResult = await this.resumeModel.aggregate([
      ...(aggregationPipeline as never),
      { $count: 'totalCount' },
    ]);

    const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

    // Execute the aggregation pipeline with pagination
    const results = await this.resumeModel.aggregate([
      ...(aggregationPipeline as never),
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          userId: 1,
          score: 1,
        },
      },
    ]);

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
