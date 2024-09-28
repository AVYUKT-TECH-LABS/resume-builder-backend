import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prismaService: PrismaService) { }

  async getCompany(id: string) {
    return this.prismaService.organization.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        logo_url: true,
        description: true,
        city: true,
        industry: true,
        num_employees: true,
        website: true,
        org_social_links: {
          select: {
            facebook: true,
            instagram: true,
            youtube: true,
            twitter: true,
          },
          where: {
            organization_id: id,
          },
        },
      },
    });
  }

  async getJobs(id: string) {
    const orgDetails = await this.prismaService.organization.findFirst({
      where: {
        id,
      },
      select: {
        name: true,
      },
    });

    const jobDetails = await this.prismaService.job.findMany({
      where: {
        Organization: {
          id,
        },
        is_deleted: false,
        status: 'active',
      },
      select: {
        id: true,
        company_name: true,
        job_title: true,
        work_location_type: true,
        office_address: true,
        fixed_salary: true,
        experience_level: true,
      },
    });

    return {
      company: orgDetails,
      details: jobDetails,
    };
  }
}
