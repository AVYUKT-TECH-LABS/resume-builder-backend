import axios from 'axios';
import { randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';
import { NotificationService } from 'src/notification/notification.service';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ApplicationStatus, Prisma } from '@prisma/client';

import { CloudService } from '../cloud/cloud.service';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import _puppeteer from '../puppeteer';
import { JobEmbeddings } from '../schemas/job-embeddings.schema';
import { Upload } from '../schemas/upload.schema';
import { ApplicationStatusCounts, DashboardData, VectorSearchResult } from '../types';
import shortId from '../utils/shortid';
import { CreateJobDto } from './dto/create-job.dto';
import { EmployerEmailSignupDto } from './dto/email.signup.dto';
import { OnBoardingDto } from './dto/onBoardDto.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class EmployerService {
  constructor(
    @InjectModel(JobEmbeddings.name)
    private jobEmbeddingsModel: Model<JobEmbeddings>,
    @InjectModel(Upload.name)
    private uploadModel: Model<Upload>,
    private prismaService: PrismaService,
    private openai: OpenAiService,
    private cloud: CloudService,
    private readonly config: ConfigService,
    private notifications: NotificationService,
  ) {}

  async createEmployeeWithoutCompany(data: EmployerEmailSignupDto) {
    const existingOrg = await this.prismaService.organization.findFirst({
      where: {
        mailDomain: this.getEmailDomain(data.email),
      },
      select: {
        id: true,
      },
    });
    const newEmployer = await this.prismaService.employer.create({
      data: {
        ...data,
        provider: 'EMAIL_PASSWORD',
        ...(existingOrg && {
          organization: {
            connect: {
              id: existingOrg.id,
            },
          },
        }),
      },
    });

    this.notifications.sendTemplateMail('templates-email-queue', {
      templateName: 'employer_welcome',
      payload: {
        email: data.email,
        user_name: data.name,
      },
    });

    return newEmployer;
  }

  async findEmployeeByEmail(email: string) {
    return this.prismaService.employer.findFirst({
      where: {
        email,
      },
    });
  }

  async createOrg(body: OnBoardingDto, employerId: string) {
    const employer = await this.prismaService.employer.findUnique({
      where: {
        id: employerId,
      },
      select: {
        id: true,
        email: true,
      },
    });
    return this.prismaService.organization.create({
      data: {
        ...body,
        mailDomain: this.getEmailDomain(employer.email),
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

  private getEmailDomain(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if the input is a valid email format
    if (!emailRegex.test(email)) {
      console.error('Invalid email format');
      return null;
    }

    // Split the email by "@" and return the domain part
    return email.split('@')[1];
  }

  async getJobs(organizationId: string) {
    return this.prismaService.job.findMany({
      where: {
        organizationId,
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
        employer: {
          select: {
            name: true,
            id: true,
            imageUrl: true,
          },
        },
        Organization: {
          select: {
            name: true,
            logo_url: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  async getJob(organizationId: string, jobId: string) {
    return this.prismaService.job.findFirst({
      where: {
        organizationId,
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
        num_openings: true,
        qualifications: true,
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
      include: {
        organization: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    if (!employer || !employer.organization) {
      throw new NotFoundException('Employer or Organization not found');
    }

    //generate embeddings for this job
    const flattenJob = this.flattenJobDto(body);
    const embeddings = await this.openai.generateEmbeddings(flattenJob);

    const createdJob = await this.prismaService.job.create({
      data: {
        company_name: employer.organization.name,
        employer: {
          connect: {
            id: employer.id,
          },
        },
        Organization: {
          connect: {
            id: employer.organization.id,
          },
        },
        ...body,
        num_openings: parseInt(body.num_openings),
        jd: JSON.stringify(body.jd),
        fixed_salary: isNaN(parseInt(body.fixed_salary))
          ? 0
          : parseInt(body.fixed_salary),
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

  async updateJob(organizationId: string, body: UpdateJobDto, jobId: string) {
    await this.prismaService.job.update({
      data: {
        ...body,
        num_openings: parseInt(body.num_openings),
        jd: JSON.stringify(body.jd),
        fixed_salary: isNaN(parseInt(body.fixed_salary))
          ? 0
          : parseInt(body.fixed_salary),
      },
      where: {
        organizationId,
        id: jobId,
      },
    });

    return {
      success: true,
      message: 'Job updated!',
    };
  }

  async deleteJob(organizationId: string, jobId: string) {
    await this.prismaService.job.update({
      data: {
        status: 'closed',
        is_deleted: true,
        deleted_at: new Date(),
      },
      where: {
        organizationId,
        id: jobId,
      },
    });

    return {
      success: true,
      message: 'Job deleted!',
    };
  }

  async inviteCandidates(
    organizationId: string,
    jobId: string,
    candidateIds: string[],
  ) {
    const [job, candidates] = await Promise.all([
      this.getJob(organizationId, jobId),
      this.getCandidateDetails(candidateIds),
    ]);
    if (!job) throw new NotFoundException('Job not found');
    await Promise.all(
      candidates.map((candidate) => {
        return this.notifications.sendTemplateMail('templates-email-queue', {
          templateName: 'job-invite',
          payload: {
            email: candidate.email,
            user_name: candidate.name,
            job_title: job.job_title,
          },
        });
      }),
    );

    // Return the results
    return 'ok';
  }

  async getCandidateDetails(candidateIds: string[]) {
    const candidates = await this.prismaService.user.findMany({
      where: {
        id: {
          in: candidateIds,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Create a map for easy lookup
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    // Check if all candidates were found
    const missingCandidates = candidateIds.filter(
      (id) => !candidateMap.has(id),
    );
    if (missingCandidates.length > 0) {
      throw new Error(`Candidates not found: ${missingCandidates.join(', ')}`);
    }

    return candidates;
  }

  async getCandidates(organizationId: string, jobId: string) {
    const job = await this.prismaService.job.findFirst({
      where: {
        id: jobId,
        organizationId,
      },
      select: {
        job_title: true,
        company_name: true,
      },
    });

    const candidates = await this.prismaService.application.findMany({
      where: {
        job: {
          organizationId,
          id: jobId,
        },
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hasImage: true,
            imageUrl: true,
          },
        },
        id: true,
        application_status: true,
        last_updated: true,
        resume_id: true,
        cover_letter: true,
        score: true,
      },
      orderBy: {
        score: 'desc',
      },
    });

    return {
      applications: candidates,
      jobDetails: job,
    };
  }

  async updateCandidateApplication(
    organizationId: string,
    jobId: string,
    body: UpdateJobApplicationDto,
  ) {
    const applicationExists = await this.prismaService.application.count({
      where: {
        id: body.application_id,
      },
    });

    if (applicationExists != 1)
      throw new NotFoundException('Application not found');

    const application = await this.prismaService.application.update({
      where: {
        id: body.application_id,
        job: {
          id: jobId,
          organizationId: organizationId,
        },
      },
      data: {
        application_status: body.application_status,
      },
      select: {
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
      templateName: 'application_status',
      payload: {
        email: application.user.email,
        application_id: body.application_id,
        job_title: application.job.job_title,
        company_name: application.job.Organization.name,
        user_name: application.user.name,
      },
    });
  }

  async createBatch(employerId: string) {
    try {
      const batch = await this.prismaService.batch.create({
        data: {
          employerId,
        },
        select: {
          id: true,
          employer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      this.notifications.sendTemplateMail('templates-email-queue', {
        templateName: 'batch_create_success',
        payload: {
          email: batch.employer.email,
          user_name: batch.employer.name,
        },
      });

      return batch;
    } catch (err) {
      throw err;
    }
  }

  async getBatch(batchId: string, employerId: string) {
    const batch = await this.prismaService.batch.findFirst({
      where: {
        id: batchId,
        employerId,
      },
    });

    const uploads = JSON.parse(String(batch.uploads)).map(
      (id: string) => new Types.ObjectId(id),
    );
    const resumes = await this.uploadModel.find({
      _id: { $in: uploads },
    });

    const totalUploads = uploads ? uploads.length : 0;

    return {
      ...batch,
      totalUploads,
      uploads: undefined,
      resumes,
    };
  }

  async getBatches(employerId: string) {
    const batches = await this.prismaService.batch.findMany({
      where: {
        employerId,
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return batches;
  }

  async createBatchJD(batchId: string, employerId: string, jd: string) {
    const currentBatch = await this.prismaService.batch.findUniqueOrThrow({
      where: {
        id: batchId,
        employerId,
      },
    });

    if (!currentBatch) throw new NotFoundException('Batch not found');

    const embeddings = await this.openai.generateEmbeddings(jd);

    await Promise.all([
      this.prismaService.batch.update({
        where: {
          id: batchId,
        },
        data: {
          jd,
        },
      }),
      this.jobEmbeddingsModel.create({
        embeddings,
        jobId: `batch_${batchId}`,
      }),
    ]);

    return 'ok';
  }

  async uploadBatchJD(
    batchId: string,
    employerId: string,
    file: Express.Multer.File,
  ) {
    const currentBatch = await this.prismaService.batch.findUniqueOrThrow({
      where: {
        id: batchId,
        employerId,
      },
    });

    if (!currentBatch) throw new NotFoundException('Batch not found');

    const extracted = await this.extractText(file);
    const embeddings = await this.openai.generateEmbeddings(extracted);

    await Promise.all([
      this.prismaService.batch.update({
        where: {
          id: batchId,
        },
        data: {
          jd: extracted,
        },
      }),
      this.jobEmbeddingsModel.create({
        embeddings,
        jobId: `batch_${batchId}`,
      }),
    ]);

    return 'ok';
  }

  async uploadBatchResumes(
    employerId: string,
    batchId: string,
    files: Array<Express.Multer.File>,
  ) {
    const currentBatch = await this.prismaService.batch.findUniqueOrThrow({
      where: {
        id: batchId,
        employerId,
      },
    });

    if (!currentBatch) throw new NotFoundException('Batch not found');
    // Get the storage service
    const storage = this.cloud.getStorageService();

    const extractionPromises = files.map(async (file) => {
      const text = await this.extractText(file);

      return text;
    });

    const extractions = await Promise.all(extractionPromises);

    const embeddingsPromises = extractions.map(async (ext) => {
      const embd = await this.openai.generateEmbeddings(ext);

      return embd;
    });

    const embds = await Promise.all(embeddingsPromises);

    // Use Promise.all to handle multiple file uploads concurrently
    const uploadPromises = files.map(async (file, idx) => {
      // Generate a short ID for each file
      const fileName = shortId() + '@' + file.originalname;

      // Upload the file to storage
      const url = await storage.uploadFile(file, fileName);

      // Save the upload information in the database
      const upload = await this.uploadModel.create({
        userId: `empl_${employerId}`,
        storageKey: url,
        shortId: fileName,
        rawContent: extractions[idx],
      });

      //re using job embeddings model to also store batch embeddings
      await this.jobEmbeddingsModel.create({
        jobId: `batch_upl_${upload.id}`,
        embeddings: embds[idx],
      });

      // Return the upload ID
      return upload._id;
    });

    // Wait for all uploads to complete and return their IDs
    const uploadIds = await Promise.all(uploadPromises);

    //saving uploadIds to batch
    const existingUploads = JSON.parse(String(currentBatch.uploads)) ?? [];
    const allUploads = [...uploadIds, ...existingUploads];

    await this.prismaService.batch.update({
      where: {
        id: batchId,
        employerId,
      },
      data: {
        uploads: JSON.stringify(allUploads),
        status: 'processed',
      },
    });

    //TODO:send batch to batch processing queue
    const sqs = this.cloud.getSqsService();

    await sqs.sendMessage('process-batch', { batchId });

    return {
      message: `Uploaded ${uploadIds.length} files`,
      uploadIds,
    };
  }

  async analyzeBatch(batchId: string, employerId: string) {
    const currentBatch = await this.prismaService.batch.findUniqueOrThrow({
      where: {
        id: batchId,
        employerId,
      },
    });

    if (!currentBatch) throw new NotFoundException('Batch not found');

    const uploadIds = JSON.parse(String(currentBatch.uploads));
    const scores = await this.getScore(batchId, uploadIds);

    return scores;
  }

  async getScore(batchId: string, uploadIds: string[]) {
    try {
      //get saved embeddings for the job
      const job = await this.jobEmbeddingsModel.findOne({
        jobId: `batch_${batchId}`,
      });

      const searchPromises = uploadIds.map((uploadId) =>
        this.vectorSearch(
          job.embeddings,
          1, // topK
          1, // limit to 1 since we're searching for specific IDs
          {
            jobId: `batch_upl_${uploadId}`,
          },
        ),
      );

      // Execute all searches in parallel
      const searchResults = await Promise.all(searchPromises);

      // Combine and flatten results
      const combinedResults: VectorSearchResult[] = searchResults
        .map((result) => result.results?.[0]) // Get first result from each search
        .filter((result) => result !== undefined); // Remove any undefined results

      // Sort by score in descending order for consistency
      combinedResults.sort((a, b) => b.score - a.score);

      return combinedResults;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  private async extractText(file: Express.Multer.File) {
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    try {
      const response = await axios.post(
        this.config.get<string>('TIKA_ENDPOINT'),
        formData,
        {
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      const data = response.data;

      return data;
    } catch (error) {
      console.error('Error sending file to Flask API:', error);
      throw new Error('Failed to process the file');
    }
  }

  private flattenJobDto(jobDto: CreateJobDto): string {
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
    jobDetails += `Job Description: ${JSON.stringify(jd)}\n`;

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

  async uploadOrgLogo(
    employerId: string,
    file: Express.Multer.File,
    isCover?: string,
  ) {
    const fileName = `${employerId}-org${isCover + randomUUID()}`;

    const storage = this.cloud.getStorageService();

    const url = await storage.uploadFile(file, fileName, 'txcl-logos');

    return url;
  }

  async download(resumeId: string) {
    // const resume = await this.get(resumeId, userId)
    const browser = await _puppeteer();
    const page = await browser.newPage();

    // Navigate to the dedicated Next.js PDF page
    const url = `${process.env.FRONTEND_URL}/pdf/${resumeId}`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    //   const customCSS = `
    //   <style>
    //     @page {
    //       margin-top: 1in;
    //       margin-bottom: 1in;
    //     }

    //     @page :first {
    //       margin-top: 0;
    //       margin-bottom:1in;
    //     }
    //   </style>
    // `;

    //   await page.addStyleTag({ content: customCSS });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      waitForFonts: true,
      preferCSSPageSize: true,
      // margin: {
      //   bottom: '1in',
      // }
    });

    await page.close();

    return pdfBuffer;
  }

  async getDashboard(employerId: string): Promise<DashboardData> {
    if (!employerId || typeof employerId !== 'string') {
      throw new Error('Invalid employerId');
    }

    try {
      const [
        organization,
        total_jobs,
        total_applications,
        total_shortlisted,
        total_rejected,
        application_status_counts,
      ] = await Promise.all([
        this.getOrganization(employerId),
        this.getTotalJobs(employerId),
        this.getTotalApplications(employerId),
        this.getTotalApplicationsByStatus(employerId, 'shortlisted'),
        this.getTotalApplicationsByStatus(employerId, 'rejected'),
        this.getApplicationStatusCounts(employerId),
      ]);

      return {
        organizationId: organization?.id ?? null,
        total_applications,
        total_jobs,
        total_rejected,
        total_shortlisted,
        application_status_counts,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  private async getOrganization(employerId: string) {
    return this.prismaService.organization.findFirst({
      where: {
        employers: {
          some: {
            id: employerId,
          },
        },
      },
      select: { id: true },
    });
  }

  private async getTotalJobs(employerId: string): Promise<number> {
    return this.prismaService.job.count({
      where: { employerId },
    });
  }

  private async getTotalApplications(employerId: string): Promise<number> {
    return this.prismaService.application.count({
      where: {
        job: { employerId },
      },
    });
  }

  private async getApplicationStatusCounts(
    employerId: string,
  ): Promise<ApplicationStatusCounts> {
    const statuses = Object.values(ApplicationStatus);
    const counts = await Promise.all(
      statuses.map((status) =>
        this.getTotalApplicationsByStatus(employerId, status),
      ),
    );

    return statuses.reduce((acc, status, index) => {
      acc[status] = counts[index];
      return acc;
    }, {} as ApplicationStatusCounts);
  }

  private async getTotalApplicationsByStatus(
    employerId: string,
    status: ApplicationStatus,
  ): Promise<number> {
    return this.prismaService.application.count({
      where: {
        job: { employerId },
        application_status: status,
      },
    });
  }

  private async vectorSearch(
    embeddings: number[],
    page: number = 1,
    pageSize: number = 10,
    matchQuery?: Record<string, any>,
  ) {
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
    const countResult = await this.jobEmbeddingsModel.aggregate(
      aggregationPipeline.concat([{ $count: 'totalCount' }]),
    );

    const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

    // Execute the aggregation pipeline with pagination
    const results = await this.jobEmbeddingsModel.aggregate(
      aggregationPipeline.concat([
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            jobId: 1,
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
