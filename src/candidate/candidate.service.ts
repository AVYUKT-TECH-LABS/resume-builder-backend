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
  JobType,
  Prisma,
  WorkLocationType,
} from '@prisma/client';
import { CandidatesDatabaseService } from '../candidates-database/candidates-database.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobPreferenceDto, UpdateJobPreferenceDto } from './dro/pref.dto';

@Injectable()
export class CandidateService {
  private readonly logger: Logger = new Logger(CandidateService.name);
  constructor(
    private prismaService: PrismaService,
    private databaseService: CandidatesDatabaseService,
  ) { }

  async create(data: Prisma.UserCreateInput) {
    return this.prismaService.user.create({
      data: {
        ...data,
        provider: 'EMAIL_PASSWORD',
      },
    });
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
  }) {
    const { search, jobType, salary, workExperience, location, minEducation } =
      filters;

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
      const validLocations: WorkLocationType[] = location
        .map((type) => type.trim())
        .filter((type) =>
          Object.values(WorkLocationType).includes(type as WorkLocationType),
        ) as WorkLocationType[];

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

    return this.prismaService.job.findMany({
      where: {
        ...where,
        is_deleted: false,
      },
      select: {
        id: true,
        job_title: true,
        fixed_salary: true,
        work_location_type: true,
        job_type: true,
        Organization: {
          select: {
            name: true,
            logo_url: true,
          },
        },
      },
    });
  }

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

    return this.prismaService.application.create({
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
    });
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
