import { Injectable } from '@nestjs/common';
import { ExperienceLevel, JobType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CandidateService {
  constructor(private prismaService: PrismaService) {}

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
      where,
    });
  }
}
