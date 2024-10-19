import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudService } from '../cloud/cloud.service';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import _puppeteer from '../puppeteer';
import { JobEmbeddings } from '../schemas/job-embeddings.schema';
import { Upload } from '../schemas/upload.schema';
import shortId from '../utils/shortid';
import { CreateJobDto } from './dto/create-job.dto';
import { EmployerEmailSignupDto } from './dto/email.signup.dto';
import { OnBoardingDto } from './dto/onBoardDto.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ApplicationStatus } from '@prisma/client';
import { DashboardData } from 'src/types';

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
    ) { }

    async createEmployeeWithoutCompany(data: EmployerEmailSignupDto) {
        return this.prismaService.employer.create({
            data: {
                ...data,
                provider: 'EMAIL_PASSWORD',
            },
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
                jd: JSON.stringify(body.jd),
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
                jd: JSON.stringify(body.jd),
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

    async createBatch(employerId: string) {
        try {
            const batch = await this.prismaService.batch.create({
                data: {
                    employerId,
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

        const uploads = JSON.parse(String(batch.uploads));
        const totalUploads = uploads ? uploads.length : 0;

        return {
            ...batch,
            totalUploads,
            uploads: undefined,
        };
    }

    async uploadBatchResumes(
        employerId: string,
        batchId: string,
        files: Array<Express.Multer.File>,
    ) {
        const currentBatch = await this.prismaService.batch.findUnique({
            where: {
                id: batchId,
            },
        });

        if (!batchId) throw new NotFoundException('Batch not found');
        // Get the storage service
        const storage = this.cloud.getStorageService();

        // Use Promise.all to handle multiple file uploads concurrently
        const uploadPromises = files.map(async (file) => {
            // Generate a short ID for each file
            const fileName = shortId();

            // Upload the file to storage
            const url = await storage.uploadFile(file, fileName);

            // Save the upload information in the database
            const upload = await this.uploadModel.create({
                userId: `empl_${employerId}`,
                storageKey: url,
                shortId: fileName,
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
                status: 'uploaded',
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

    async uploadOrgLogo(employerId: string, file: Express.Multer.File) {
        const fileName = `${employerId}-org`;

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
                total_rejected
            ] = await Promise.all([
                this.getOrganization(employerId),
                this.getTotalJobs(employerId),
                this.getTotalApplications(employerId),
                this.getTotalApplicationsByStatus(employerId, "shortlisted"),
                this.getTotalApplicationsByStatus(employerId, "rejected")
            ]);

            return {
                organizationId: organization?.id ?? null,
                total_applications,
                total_jobs,
                total_rejected,
                total_shortlisted
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
                        id: employerId
                    }
                }
            },
            select: { id: true }
        });
    }

    private async getTotalJobs(employerId: string): Promise<number> {
        return this.prismaService.job.count({
            where: { employerId }
        });
    }

    private async getTotalApplications(employerId: string): Promise<number> {
        return this.prismaService.application.count({
            where: {
                job: { employerId }
            }
        });
    }

    private async getTotalApplicationsByStatus(employerId: string, status: ApplicationStatus): Promise<number> {
        return this.prismaService.application.count({
            where: {
                job: { employerId },
                application_status: status
            }
        });
    }
}
