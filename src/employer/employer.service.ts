import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { EmailSignupDto } from './dto/email.signup.dto';
import { OnBoardingDto } from './dto/onBoardDto.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { OpenAiService } from '../openai/openai.service';
import { InjectModel } from '@nestjs/mongoose';
import { JobEmbeddings } from '../schemas/job-embeddings.schema';
import { Model } from 'mongoose';

@Injectable()
export class EmployerService {
  constructor(
    @InjectModel(JobEmbeddings.name)
    private jobEmbeddingsModel: Model<JobEmbeddings>,
    private prismaService: PrismaService,
    private openai: OpenAiService,
  ) {}

  async createEmployeeWithoutCompany(data: EmailSignupDto) {
    return this.prismaService.employer.create({
      data,
    });
  }

  async findEmployeeByEmail(email: string) {
    return this.prismaService.employer.findFirst({
      where: {
        email,
      },
    });
  }

  async createOrg(body: OnBoardingDto, employerId: string) {
    return this.prismaService.organization.create({
      data: {
        ...body,
        org_social_links: {
          create: {
            ...body.org_social_links,
          },
        },
        employers: {
          connect: {
            id: employerId,
          },
        },
      },
    });
  }

  async getJobs(employerId: string) {
    return this.prismaService.job.findMany({
      where: {
        employerId,
      },
      select: {
        id: true,
        status: true,
        company_name: true,
        job_title: true,
        work_location_type: true,
        created_at: true,
        is_deleted: true,
        deleted_at: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  async getJob(employerId: string, jobId: string) {
    return this.prismaService.job.findFirst({
      where: {
        employerId,
        id: jobId,
      },
      select: {
        id: true,
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
        is_deleted: true,
        created_at: true,
      },
    });
  }

  async addJob(employerId: string, body: CreateJobDto) {
    const employer = await this.prismaService.employer.findUnique({
      where: { id: employerId },
      include: { organization: true },
    });

    if (!employer || !employer.organization) {
      throw new NotFoundException('Employer or Organization not found');
    }

    //generate embeddings for this job
    const flattenJob = this.flattenJobDto(body);
    const embeddings = await this.openai.generateEmbeddings(flattenJob);

    const createdJob = await this.prismaService.job.create({
      data: {
        ...body,
        company_name: employer.organization.name,
        employer: {
          connect: { id: employerId },
        },
        Organization: {
          connect: { id: employer.organization.id },
        },
      },
    });

    //save embeddings
    await this.jobEmbeddingsModel.create({
      embeddings,
      jobId: createdJob.id,
    });

    return {
      success: true,
      message: 'Job added!',
    };
  }

  async updateJob(employerId: string, body: UpdateJobDto, jobId: string) {
    await this.prismaService.job.update({
      data: {
        ...body,
      },
      where: {
        employerId,
        id: jobId,
      },
    });

    return {
      success: true,
      message: 'Job updated!',
    };
  }

  async deleteJob(employerId: string, jobId: string) {
    await this.prismaService.job.update({
      data: {
        status: 'closed',
        is_deleted: true,
        deleted_at: new Date(),
      },
      where: {
        employerId,
        id: jobId,
      },
    });

    return {
      success: true,
      message: 'Job deleted!',
    };
  }

  async getCandidates(employerId: string, jobId: string) {
    const job = await this.prismaService.job.findFirst({
      where: {
        id: jobId,
        employerId,
      },
      select: {
        job_title: true,
        company_name: true,
      },
    });

    const candidates = await this.prismaService.application.findMany({
      where: {
        job: {
          employerId,
          id: jobId,
        },
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        id: true,
        application_status: true,
        last_updated: true,
        resume_id: true,
        cover_letter: true,
      },
    });

    return {
      applications: candidates,
      jobDetails: job,
    };
  }

  async updateCandidateApplication(
    employerId: string,
    jobId: string,
    body: UpdateJobApplicationDto,
  ) {
    await this.prismaService.application.update({
      where: {
        id: body.application_id,
        job: {
          id: jobId,
          employerId: employerId,
        },
      },
      data: {
        application_status: body.application_status,
      },
    });
  }

  flattenJobDto(jobDto: CreateJobDto): string {
    const {
      status,
      job_title,
      job_type,
      is24_7,
      work_location_type,
      pay_type,
      fixed_salary,
      avg_incentive,
      perks,
      joining_fee_required,
      joining_fee,
      minimum_edu,
      english_level,
      experience_level,
      total_experience,
      gender,
      age,
      regional_languages,
      required_assets,
      skills,
      jd,
      interview_type,
      interview_address,
      walk_in_start_date,
      walk_in_end_date,
      walk_in_timings,
      other_instructions,
      online_interview_link,
    } = jobDto;

    // Basic job details
    let jobDetails = `Job Title: ${job_title}\n`;
    jobDetails += `Status: ${status}\n`;
    jobDetails += `Job Type: ${job_type}\n`;
    jobDetails += `24/7: ${is24_7 ? 'Yes' : 'No'}\n`;
    jobDetails += `Location Type: ${work_location_type}\n`;

    // Salary and perks
    if (fixed_salary) jobDetails += `Fixed Salary: ${fixed_salary}\n`;
    if (avg_incentive) jobDetails += `Avg Incentive: ${avg_incentive}\n`;
    if (perks && perks.length) jobDetails += `Perks: ${perks}\n`;
    jobDetails += `Pay Type: ${pay_type}\n`;
    jobDetails += `Joining Fee Required: ${joining_fee_required ? 'Yes' : 'No'}\n`;
    if (joining_fee) jobDetails += `Joining Fee: ${joining_fee}\n`;

    // Candidate requirements
    jobDetails += `Minimum Education: ${minimum_edu}\n`;
    jobDetails += `English Level: ${english_level}\n`;
    jobDetails += `Experience Level: ${experience_level}\n`;
    if (total_experience)
      jobDetails += `Total Experience: ${total_experience}\n`;
    if (gender) jobDetails += `Gender: ${gender}\n`;
    if (age) jobDetails += `Age: ${age}\n`;
    if (regional_languages && regional_languages.length)
      jobDetails += `Languages: ${regional_languages}\n`;
    if (required_assets && required_assets.length)
      jobDetails += `Required Assets: ${required_assets}\n`;
    if (skills && skills.length) jobDetails += `Skills: ${skills}\n`;

    // Job description
    jobDetails += `Job Description: ${jd}\n`;

    // Interview details
    jobDetails += `Interview Type: ${interview_type}\n`;
    if (interview_address)
      jobDetails += `Interview Address: ${interview_address}\n`;
    if (walk_in_start_date)
      jobDetails += `Walk-in Start Date: ${walk_in_start_date}\n`;
    if (walk_in_end_date)
      jobDetails += `Walk-in End Date: ${walk_in_end_date}\n`;
    if (walk_in_timings) jobDetails += `Walk-in Timings: ${walk_in_timings}\n`;
    if (other_instructions)
      jobDetails += `Other Instructions: ${other_instructions}\n`;
    if (online_interview_link)
      jobDetails += `Online Interview Link: ${online_interview_link}\n`;

    return jobDetails.trim();
  }
}
