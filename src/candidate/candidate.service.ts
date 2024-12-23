import {
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    ApplicationStatus,
    EducationLevel,
    ExperienceLevel,
    Job_work_location_type,
    JobType,
    Prisma,
} from '@prisma/client';
import { CandidatesDatabaseService } from '../candidates-database/candidates-database.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobPreferenceDto, UpdateJobPreferenceDto } from './dro/pref.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CandidateService {
    private readonly logger: Logger = new Logger(CandidateService.name);
    constructor(
        private prismaService: PrismaService,
        private databaseService: CandidatesDatabaseService,
        private notifications: NotificationService,
    ) { }

    async create(data: Prisma.UserCreateInput, bypass: boolean = false) {
        const newUser = await this.prismaService.user.create({
            data: {
                ...data,
                credits: 30,
            },
        });

        if (!bypass)
            this.notifications.sendTemplateMail('templates-email-queue', {
                templateName: 'user_welcome',
                payload: {
                    email: newUser.email,
                    user_name: newUser.name,
                },
            });

        return newUser;
    }

    async findUserByEmail(email: string) {
        return this.prismaService.user.findFirst({
            where: {
                email,
            },
        });
    }

    async getJobs(filters: {
        search?: string;
        salary?: string[];
        jobType?: string[];
        workExperience?: string[];
        location?: string[];
        minEducation?: string[];
        page?: number;
        limit?: number;
    }) {
        const {
            search,
            jobType,
            salary,
            workExperience,
            location,
            minEducation,
            page = 1,
            limit = 10
        } = filters;

        const where: Prisma.JobWhereInput = {};

        if (search) {
            where.job_title = {
                contains: search,
            };
        }

        if (workExperience && workExperience.length > 0) {
            const validExperienceLevels: ExperienceLevel[] = workExperience
                .map((level) => level.trim())
                .filter((level) =>
                    Object.values(ExperienceLevel).includes(level as ExperienceLevel),
                ) as ExperienceLevel[];

            if (validExperienceLevels.length > 0) {
                where.experience_level = {
                    in: validExperienceLevels,
                };
            }
        }

        if (salary && salary.length > 0) {
            const validSalaries = salary
                .map((sal) => parseFloat(sal))
                .filter((sal) => !isNaN(sal));

            if (validSalaries.length > 0) {
                where.OR = validSalaries.map((salary) => ({
                    fixed_salary: {
                        gte: salary,
                    },
                }));
            }
        }

        if (jobType && jobType.length > 0) {
            const validJobTypes: JobType[] = jobType
                .map((type) => type.trim())
                .filter((type) =>
                    Object.values(JobType).includes(type as JobType),
                ) as JobType[];

            if (validJobTypes.length > 0) {
                where.job_type = {
                    in: validJobTypes,
                };
            }
        }

        if (location && location.length > 0) {
            const validLocations: Job_work_location_type[] = location
                .map((type) => type.trim())
                .filter((type) =>
                    Object.values(Job_work_location_type).includes(
                        type as Job_work_location_type,
                    ),
                ) as Job_work_location_type[];

            if (validLocations.length > 0) {
                where.work_location_type = {
                    in: validLocations,
                };
            }
        }

        if (minEducation && minEducation.length > 0) {
            const validMinEdu: EducationLevel[] = minEducation
                .map((type) => type.trim())
                .filter((type) =>
                    Object.values(EducationLevel).includes(type as EducationLevel),
                ) as EducationLevel[];

            if (validMinEdu.length > 0) {
                where.minimum_edu = {
                    in: validMinEdu,
                };
            }
        }

        // Get total count for pagination
        const totalItems = await this.prismaService.job.count({
            where: {
                ...where,
                is_deleted: false,
            },
        });

        // Calculate pagination values
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated data
        const jobs = await this.prismaService.job.findMany({
            where: {
                ...where,
                is_deleted: false,
            },
            select: {
                id: true,
                job_title: true,
                fixed_salary: true,
                currency: true,
                work_location_type: true,
                job_type: true,
                Organization: {
                    select: {
                        name: true,
                        logo_url: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc'
            },
            skip,
            take: limit,
        });

        return {
            data: jobs,
            meta: {
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            }
        };
    }
    Improve
    Explain


    async getJob(jobId: string) {
        return this.prismaService.job.findFirst({
            where: {
                id: jobId,
                is_deleted: false,
            },
            include: {
                Organization: {
                    select: {
                        id: true,
                        description: true,
                        name: true,
                        logo_url: true,
                    },
                },
            },
        });
    }

    async getApplications(candidateId: string) {
        const applications = await this.prismaService.application.findMany({
            where: {
                userId: candidateId,
            },
            include: {
                job: {
                    select: {
                        job_title: true,
                        Organization: {
                            select: {
                                name: true,
                                logo_url: true,
                            },
                        },
                    },
                },
            },
        });

        const applicationsByStatus: Partial<Record<ApplicationStatus, any[]>> = {};

        // Initialize arrays for each status
        for (const status in ApplicationStatus) {
            if (isNaN(Number(status))) {
                applicationsByStatus[ApplicationStatus[status]] = [];
            }
        }

        for (const application of applications) {
            const status = application.application_status;
            if (!applicationsByStatus[status]) {
                applicationsByStatus[status] = [];
            }

            applicationsByStatus[status].push(application);
        }

        return applicationsByStatus;
    }

    async apply(jobId: string, candidateId: string, resumeId: string) {
        const [existingApplication, scoreResult] = await Promise.all([
            this.prismaService.application.findFirst({
                where: {
                    userId: candidateId,
                    jobId,
                },
                select: {
                    id: true,
                },
            }),
            this.databaseService.getScore(candidateId, resumeId, jobId),
        ]);

        if (existingApplication)
            throw new ForbiddenException('You have already applied to this job');

        const score = scoreResult.length > 0 ? scoreResult[0].score : 0;

        const newApplication = await this.prismaService.application.create({
            data: {
                resume_id: resumeId,
                application_status: 'application_recieved',
                last_updated: new Date(),
                score,
                job: {
                    connect: {
                        id: jobId,
                    },
                },
                user: {
                    connect: {
                        id: candidateId,
                    },
                },
            },
            select: {
                id: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                job: {
                    select: {
                        job_title: true,
                        Organization: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        this.notifications.sendTemplateMail('templates-email-queue', {
            templateName: 'application_success',
            payload: {
                email: newApplication.user.email,
                application_id: newApplication.id,
                job_title: newApplication.job.job_title,
                company_name: newApplication.job.Organization.name,
                user_name: newApplication.user.name,
            },
        });

        return newApplication;
    }

    async createPreferences(pref: CreateJobPreferenceDto, userId: string) {
        try {
            const newPreference = await this.prismaService.jobPreference.create({
                data: {
                    userId,
                    user: {
                        connect: {
                            id: userId,
                        },
                    },
                    jobType: pref.jobType,
                    minSalary: parseFloat(String(pref.minSalary)),
                    maxSalary: parseFloat(String(pref.maxSalary)),
                    location: pref.location,
                    remoteWork: pref.remoteWork,
                },
            });

            return newPreference.id;
        } catch (err) {
            this.logger.log(err);
            throw err;
        }
    }

    async updatePreferences(pref: UpdateJobPreferenceDto, userId: string) {
        try {
            const user = await this.prismaService.user.findFirstOrThrow({
                where: {
                    id: userId,
                },
                select: {
                    jobPreferenceId: true,
                },
            });

            if (!user.jobPreferenceId)
                throw new NotFoundException('Your preferences not found');

            const updatedPreference = await this.prismaService.jobPreference.update({
                where: {
                    userId,
                    id: user.jobPreferenceId,
                },
                data: {
                    jobType: pref.jobType,
                    minSalary: parseFloat(String(pref.minSalary)),
                    maxSalary: parseFloat(String(pref.maxSalary)),
                    location: pref.location,
                    remoteWork: pref.remoteWork,
                },
            });

            return updatedPreference.id;
        } catch (err) {
            this.logger.log(err);
            throw err;
        }
    }
}
