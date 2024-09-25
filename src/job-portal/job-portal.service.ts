import { createClerkClient } from '@clerk/clerk-sdk-node';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import _puppeteer from 'src/puppeteer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobPortalService {
  private readonly clerkClient: ReturnType<typeof createClerkClient>;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.clerkClient = this.configService.get('clerk');
  }

  // Employer
  async getAllJobsForEmployer(employerId: string) {
    const allJobs = await this.prisma.job.findMany({
      where: { employerId },
      select: {
        id: true,
        status: true,
        company_name: true,
        job_title: true,
        work_location_type: true,
        createdAt: true,
      },
    });

    const jobsWithApplicants = await Promise.all(
      allJobs.map(async (job) => {
        const applicantsCount = await this.prisma.application.count({
          where: {
            jobId: job.id,
          },
        });

        return {
          ...job,
          applicants: applicantsCount,
        };
      }),
    );

    return jobsWithApplicants;
  }

  async getSpecificJobForEmployer(employerId: string, jobId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId, employerId },
      select: {
        status: true,
        company_name: true,
        job_title: true,
        job_type: true,
        is24_7: true,
        work_location_type: true,
        office_address: true,
        pay_type: true,
        fixed_salary: true,
        avg_incentive: true,
        perks: true,
        joining_fee_required: true,
        joining_fee: true,
        minimum_edu: true,
        english_level: true,
        experience_level: true,
        total_experience: true,
        gender: true,
        age: true,
        regional_languages: true,
        required_assets: true,
        skills: true,
        jd: true,
        interview_type: true,
        interview_address: true,
        walk_in_start_date: true,
        walk_in_end_date: true,
        walk_in_timings: true,
        other_instructions: true,
        online_interview_link: true,
        createdAt: true,
      },
    });
  }

  async getCandidatesForSpecificJob(employerId: string, jobId: string) {
    const jobExists = await this.prisma.job.findUnique({
      where: {
        employerId,
        id: jobId,
      },
      select: {
        job_title: true,
        company_name: true,
      },
    });

    if (!jobExists) {
      throw new NotFoundException('Job not found!');
    }

    const applications = await this.prisma.application.findMany({
      where: {
        id: jobId,
      },
      select: {
        userId: true,
        resume_id: true,
        application_status: true,
        cover_letter: true,
        last_updated: true,
      },
    });

    const userIds = [...new Set(applications.map((app) => app.userId))];

    const userDetailsPromises = userIds.map(async (userId) => {
      try {
        const user = await this.clerkClient.users.getUser(userId);

        return {
          userId: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.primaryEmailAddress.emailAddress || '',
        };
      } catch (error) {
        return null;
      }
    });

    const userDetails = await Promise.all(userDetailsPromises);

    const completeApplications = applications.map((application) => {
      const userDetail = userDetails.find(
        (user) => user?.userId === application.userId,
      );

      return {
        ...application, // Convert Mongoose model to plain object
        userDetail,
      };
    });

    return {
      applications: completeApplications,
      jobDetails: jobExists,
    };
  }

  async updateSpecificJobApplicationForCandidate(
    employerId: string,
    jobId: string,
    updatedDetails: UpdateJobApplicationDto,
  ) {
    const jobExists = await this.prisma.job.findUnique({
      where: {
        employerId: employerId,
        id: jobId,
      },
    });

    if (!jobExists) {
      throw new NotFoundException('Job not found!');
    }

    return this.prisma.application.update({
      where: {
        id: jobId,
        userId: updatedDetails.user_id,
      },
      data: {
        application_status: updatedDetails.application_status,
      },
    });
  }

  async updateSpecificJobApplicationForEmployer(
    employerId: string,
    jobId: string,
    updateResumeDto: UpdateJobDto,
  ) {
    return this.prisma.job.update({
      where: {
        id: jobId,
        employerId: employerId,
      },
      data: updateResumeDto as never,
    });
  }

  async deleteSpecificJobForEmployer(employerId: string, jobId: string) {
    return this.prisma.job.update({
      where: { employerId: employerId, id: jobId },
      data: { status: 'closed' },
    });
  }

  async createJobPostingForEmployer(
    createJobPortalDto: CreateJobDto,
    employerId: string,
  ) {
    try {
      const jobPosted = await this.prisma.job.create({
        data: {
          ...createJobPortalDto,
          employerId,
        } as never,
      });

      return jobPosted;
    } catch (err) {
      throw new InternalServerErrorException('Failed to post job');
    }
  }

  async downloadCandidateResume(resumeId: string) {
    const browser = await _puppeteer();
    const page = await browser.newPage();

    const url = `${process.env.FRONTEND_URL}/pdf/${resumeId}`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      waitForFonts: true,
      preferCSSPageSize: true,
    });

    await page.close();

    return pdfBuffer;
  }

  // Candidate
  async getAllJobs() {
    return this.prisma.job.findMany({
      select: {
        status: true,
        company_name: true,
        job_title: true,
        job_type: true,
        is24_7: true,
        work_location_type: true,
        office_address: true,
        pay_type: true,
        fixed_salary: true,
        avg_incentive: true,
        perks: true,
        joining_fee_required: true,
        joining_fee: true,
        minimum_edu: true,
        english_level: true,
        experience_level: true,
        total_experience: true,
        gender: true,
        age: true,
        regional_languages: true,
        required_assets: true,
        skills: true,
        jd: true,
        interview_type: true,
        interview_address: true,
        walk_in_start_date: true,
        walk_in_end_date: true,
        walk_in_timings: true,
        other_instructions: true,
        online_interview_link: true,
        createdAt: true,
      },
    });
  }

  async createJobApplicationForCandidate(
    candidateId: string,
    resumeId: string,
    jobId: string,
  ) {
    try {
      const applicationExists = await this.prisma.application.findUnique({
        where: {
          id: jobId,
          userId: candidateId,
        },
      });

      if (applicationExists) {
        throw new ConflictException('Application already exists!');
      }

      const jobPosted = await this.prisma.application.create({
        data: {
          application_status: 'application_recieved',
          last_updated: new Date(),
          resume_id: resumeId,
          userId: candidateId,
          jobId: jobId,
          cover_letter: '',
        },
      });
      return jobPosted;
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw new InternalServerErrorException('Failed to post job');
    }
  }

  async withdrawJobApplicationForCandidate(candidateId: string, jobId: string) {
    return this.prisma.application.delete({
      where: {
        userId: candidateId,
        jobId: jobId,
      },
    });
  }

  async getSepcificJob(jobId: string) {
    return this.prisma.job.findUnique({
      where: {
        id: jobId,
      },
      select: {
        status: true,
        company_name: true,
        job_title: true,
        job_type: true,
        is24_7: true,
        work_location_type: true,
        office_address: true,
        pay_type: true,
        fixed_salary: true,
        avg_incentive: true,
        perks: true,
        joining_fee_required: true,
        joining_fee: true,
        minimum_edu: true,
        english_level: true,
        experience_level: true,
        total_experience: true,
        gender: true,
        age: true,
        regional_languages: true,
        required_assets: true,
        skills: true,
        jd: true,
        interview_type: true,
        interview_address: true,
        walk_in_start_date: true,
        walk_in_end_date: true,
        walk_in_timings: true,
        other_instructions: true,
        online_interview_link: true,
        createdAt: true,
      },
    });
  }

  async allJobApplicationForCandidate(candidateId: string) {
    const appliedApplications = await this.prisma.application.findMany({
      where: {
        userId: candidateId,
      },
      select: {
        jobId: true,
        application_status: true,
        resume_id: true,
        last_updated: true,
      },
    });

    const applicationDetails = await Promise.all(
      appliedApplications.map(async (application) => {
        const jobDetails = await this.prisma.job.findUnique({
          where: {
            id: application.jobId,
          },
          select: {
            status: true,
            company_name: true,
            job_title: true,
            work_location_type: true,
            createdAt: true,
          },
        });

        return {
          ...application,
          job_details: jobDetails,
        };
      }),
    );

    return applicationDetails;
  }
}
