import { Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  ExperienceLevel,
  JobType,
  Prisma,
} from '@prisma/client';
import { CandidateEmailSignupDto } from '../employer/dto/email.signup.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CandidatesDatabaseService } from '../candidates-database/candidates-database.service';

@Injectable()
export class CandidateService {
  constructor(
    private prismaService: PrismaService,
    private databaseService: CandidatesDatabaseService,
  ) {}

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
    salary?: string;
    jobType?: string[];
    workExperience?: string[];
  }) {
    const { search, salary, jobType, workExperience } = filters;

    const where: Prisma.JobWhereInput = {};

    if (search) {
      where.job_title = {
        contains: search,
      };
    }

    if (salary) {
      const salaryInt = parseInt(salary, 10); // Convert salary query to an integer
      if (!isNaN(salaryInt)) {
        // Filter based on string comparison. This won't work perfectly due to string nature but works for some cases.
        where.fixed_salary = {
          gte: salary.toString(),
        };
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
    // const score = await this.databaseService.getScore(
    //   candidateId,
    //   resumeId,
    //   jobId,
    // );

    // console.log(score);
    return this.prismaService.application.create({
      data: {
        resume_id: resumeId,
        application_status: 'application_recieved',
        last_updated: new Date(),
        // score,
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
}
