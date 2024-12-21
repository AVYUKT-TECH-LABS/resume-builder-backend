import { Model, Types } from 'mongoose';
import { z } from 'zod';

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobEmbeddings } from '../schemas/job-embeddings.schema';
import { ResumeV2 } from '../schemas/resume.schema.v2';

@Injectable()
export class CandidatesDatabaseService {
    private logger: Logger = new Logger(CandidatesDatabaseService.name);
    constructor(
        @InjectModel(ResumeV2.name) private resumeModel: Model<ResumeV2>,
        private openai: OpenAiService,
        private prisma: PrismaService,
        @InjectModel(JobEmbeddings.name)
        private jobEmbeddingsModel: Model<JobEmbeddings>,
    ) { }

    async getRecommendedCandidatesForJob(
        jobId: string,
        page: number = 1,
        pageSize: number = 10,
        filters?: Record<string, unknown>,
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
                filters,
            );

            return {
                results: recommendedCandidates.filter((cand) => cand.user !== null),
                pagination: vectorResponse.pagination,
            };
        } catch (err) {
            this.logger.log('Failed to get recommended candidates', err);
            throw err;
        }
    }

    async search(query: string, page: number = 1, pageSize: number = 10) {
        try {
            if (query.trim()) {
                // Generate embeddings for the query
                const embeddings = await this.openai.generateEmbeddings(query);

                // Perform vector-based search with pagination
                const vectorResponse = await this.vectorSearch(embeddings, page, pageSize);
                const candidates = await this.getUserDetails(vectorResponse.results);

                return {
                    results: candidates,
                    pagination: {
                        currentPage: page,
                        pageSize: pageSize,
                        totalCount: vectorResponse.pagination.totalCount,
                        totalPages: Math.ceil(vectorResponse.pagination.totalCount / pageSize),
                    },
                };
            } else {
                // Fetch unique resumes based on `userId`
                const resumes = await this.resumeModel.aggregate([
                    {
                        $group: {
                            _id: '$userId',
                            userId: { $first: '$userId' },
                            originalId: { $first: '$_id' },
                        },
                    },
                    {
                        $project: {
                            _id: '$originalId',
                            userId: 1,
                        },
                    },
                ]);

                const candidates = (await this.getUserDetails(resumes as never)).filter(
                    (c) => c.user != null,
                );

                // Paginate results manually
                const totalCount = candidates.length;
                const totalPages = Math.ceil(totalCount / pageSize);

                const paginatedResults = candidates.slice((page - 1) * pageSize, page * pageSize);

                return {
                    results: paginatedResults,
                    pagination: {
                        currentPage: page,
                        pageSize: pageSize,
                        totalCount: totalCount,
                        totalPages: totalPages,
                    },
                };
            }
        } catch (err) {
            this.logger.error('Failed to search candidates', { error: err });
            throw new Error('Search operation failed. Please try again later.');
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
        filters?: Record<string, unknown>,
    ) {
        const userIds = data
            .map((item) => item.userId)
            .filter((id) => id !== 'GUEST_USER');
        const resumeIds = data.map((item) => item._id);

        try {
            const users = await this.prisma.user.findMany({
                where: {
                    id: {
                        in: userIds,
                    },
                    banned: false,
                    locked: false,
                    ...(filters &&
                        Object.keys(filters).length > 0 && {
                        jobPreferences: {
                            ...(filters.job_type && {
                                jobType: String(filters.job_type)
                                    .toLowerCase()
                                    .replace('-', '_'),
                            }),
                            ...(filters.remote_work && {
                                remoteWork: filters.remote_work,
                            }),
                            ...(filters.location && {
                                location: filters.location,
                            }),
                            ...(filters.maxSalary && {
                                minSalary: { lte: Number(filters.maxSalary) },
                                maxSalary: { lte: Number(filters.maxSalary) },
                            }),
                        } as never,
                    }),
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
        console.log("b", pageSize)

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
