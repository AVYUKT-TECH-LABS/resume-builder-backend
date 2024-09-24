import { createClerkClient } from '@clerk/clerk-sdk-node';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobApplications } from 'src/schemas/job-application.schema';
import { Job } from 'src/schemas/job.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import _puppeteer from 'src/puppeteer';

@Injectable()
export class JobPortalService {
  private readonly clerkClient: ReturnType<typeof createClerkClient>;

  constructor(
    @InjectModel(Job.name) private jobModel: Model<Job>,
    @InjectModel(JobApplications.name)
    private jobApplicationModel: Model<JobApplications>,
    private configService: ConfigService,
  ) {
    this.clerkClient = this.configService.get('clerk');
  }

  // Employer
  async getAllJobsForEmployer(employerId: string) {
    const allJobs = await this.jobModel
      .find(
        { employer_id: employerId },
        {
          status: 1,
          company_name: 1,
          job_title: 1,
          work_location_type: 1,
          createdAt: 1,
        },
      )
      .exec();

    const jobsWithApplicants = await Promise.all(
      allJobs.map(async (job) => {
        const applicantsCount = await this.jobApplicationModel
          .countDocuments({ job_id: job._id })
          .exec();

        return {
          ...job.toObject(),
          applicants: applicantsCount,
        };
      }),
    );

    return jobsWithApplicants;
  }

  async getSpecificJobForEmployer(employerId: string, jobId: string) {
    return this.jobModel.findOne(
      { _id: jobId, employer_id: employerId },
      {
        status: 1,
        company_name: 1,
        job_title: 1,
        job_type: 1,
        is24_7: 1,
        work_location_type: 1,
        office_address: 1,
        pay_type: 1,
        fixed_salary: 1,
        avg_incentive: 1,
        perks: 1,
        joining_fee_required: 1,
        joining_fee: 1,
        minimum_edu: 1,
        english_level: 1,
        experience_level: 1,
        total_experience: 1,
        gender: 1,
        age: 1,
        regional_languages: 1,
        required_assets: 1,
        skills: 1,
        jd: 1,
        interview_type: 1,
        interview_address: 1,
        walk_in_start_date: 1,
        walk_in_end_date: 1,
        walk_in_timings: 1,
        other_instructions: 1,
        online_interview_link: 1,
        createdAt: 1,
      },
    );
  }

  async getCandidatesForSpecificJob(employerId: string, jobId: string) {
    const jobExists = await this.jobModel.findOne(
      {
        employer_id: employerId,
        _id: jobId,
      },
      {
        job_title: 1,
        company_name: 1,
      },
    );

    if (!jobExists) {
      throw new NotFoundException('Job not found!');
    }

    const applications = await this.jobApplicationModel.find(
      {
        job_id: jobId,
      },
      {
        user_id: 1,
        resume_id: 1,
        application_status: 1,
        cover_letter: 1,
        last_updated: 1,
      },
    );

    const userIds = [...new Set(applications.map((app) => app.user_id))];

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
        (user) => user?.userId === application.user_id,
      );

      return {
        ...application.toObject(), // Convert Mongoose model to plain object
        userDetail,
      };
    });

    return {
      applications: completeApplications,
      jobDetails: jobExists.toObject(),
    };
  }

  async updateSpecificJobApplicationForCandidate(
    employerId: string,
    jobId: string,
    updatedDetails: UpdateJobApplicationDto,
  ) {
    const jobExists = await this.jobModel.findOne({
      employer_id: employerId,
      _id: jobId,
    });

    if (!jobExists) {
      throw new NotFoundException('Job not found!');
    }

    return this.jobApplicationModel.updateOne(
      {
        job_id: jobId,
        user_id: updatedDetails.user_id,
      },
      {
        application_status: updatedDetails.application_status,
      },
    );
  }

  async updateSpecificJobApplicationForEmployer(
    employerId: string,
    jobId: string,
    updateResumeDto: UpdateJobDto,
  ) {
    return this.jobModel.updateOne(
      {
        _id: jobId,
        employer_id: employerId,
      },
      {
        ...updateResumeDto,
      },
    );
  }

  async deleteSpecificJobForEmployer(employerId: string, jobId: string) {
    return this.jobModel.deleteOne({ employer_id: employerId, _id: jobId });
  }

  async createJobPostingForEmployer(
    createJobPortalDto: CreateJobDto,
    employerId: string,
  ) {
    try {
      const jobPosted = new this.jobModel({
        ...createJobPortalDto,
        employer_id: employerId,
      });
      return jobPosted.save();
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
    return this.jobModel
      .find()
      .select({
        status: 1,
        company_name: 1,
        job_title: 1,
        job_type: 1,
        is24_7: 1,
        work_location_type: 1,
        office_address: 1,
        pay_type: 1,
        fixed_salary: 1,
        avg_incentive: 1,
        perks: 1,
        joining_fee_required: 1,
        joining_fee: 1,
        minimum_edu: 1,
        english_level: 1,
        experience_level: 1,
        total_experience: 1,
        gender: 1,
        age: 1,
        regional_languages: 1,
        required_assets: 1,
        skills: 1,
        jd: 1,
        interview_type: 1,
        interview_address: 1,
        walk_in_start_date: 1,
        walk_in_end_date: 1,
        walk_in_timings: 1,
        other_instructions: 1,
        online_interview_link: 1,
        createdAt: 1,
      })
      .exec();
  }

  async createJobApplicationForCandidate(
    candidateId: string,
    resumeId: string,
    jobId: string,
  ) {
    try {
      const applicationExists = await this.jobApplicationModel.findOne({
        job_id: jobId,
        user_id: candidateId,
      });

      if (applicationExists) {
        throw new ConflictException('Application already exists!');
      }

      const jobPosted = new this.jobApplicationModel({
        application_status: 'application_recieved',
        last_updated: new Date(),
        resume_id: resumeId,
        user_id: candidateId,
        job_id: jobId,
        cover_letter: '',
      });
      return jobPosted.save();
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw new InternalServerErrorException('Failed to post job');
    }
  }

  async withdrawJobApplicationForCandidate(candidateId: string, jobId: string) {
    return this.jobApplicationModel.deleteOne({
      user_id: candidateId,
      job_id: jobId,
    });
  }
}
