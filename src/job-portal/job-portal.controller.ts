import { User } from '@clerk/clerk-sdk-node';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { GetUser } from 'src/decorators/user.decorator';
import { ClerkAuthGuard } from 'src/guards/clerk.guard';

import { CreateJobDto } from './dto/create-job.dto';

import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobPortalService } from './job-portal.service';

@Controller('job-portal')
export class JobPortalController {
  constructor(private readonly jobPortalService: JobPortalService) {}

  @UseGuards(ClerkAuthGuard)
  @Get('/employer/job')
  async getAllJobPostingForEmployer(@GetUser() user: User) {
    return this.jobPortalService.getAllJobsForEmployer(user.id);
  }

  @UseGuards(ClerkAuthGuard)
  @Get('/employer/job/:id')
  async getSpecificJobPostingForEmployer(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.jobPortalService.getSpecificJobForEmployer(user.id, id);
  }

  @UseGuards(ClerkAuthGuard)
  @Post('/employer/job')
  async createJobPostingForEmployer(
    @GetUser() user: User,
    @Body() jobDetails: CreateJobDto,
  ) {
    return this.jobPortalService.createJobPostingForEmployer(
      jobDetails,
      user.id,
    );
  }

  @UseGuards(ClerkAuthGuard)
  @Patch('/employer/job/update/:id')
  async updateSpecificJobPostingForEmployer(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateResumeDto: UpdateJobDto,
  ) {
    return this.jobPortalService.updateSpecificJobApplicationForEmployer(
      user.id,
      id,
      updateResumeDto,
    );
  }

  @UseGuards(ClerkAuthGuard)
  @Get('/employer/job/candidate/:id')
  async getCandidatesForSpecificJob(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.jobPortalService.getCandidatesForSpecificJob(user.id, id);
  }

  @UseGuards(ClerkAuthGuard)
  @Patch('/employer/job/candidate/update/:id')
  async updateSpecificJobApplicationForCandidate(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updatedDetails: UpdateJobApplicationDto,
  ) {
    return this.jobPortalService.updateSpecificJobApplicationForCandidate(
      user.id,
      id,
      updatedDetails,
    );
  }

  @UseGuards(ClerkAuthGuard)
  @Post('/employer/job/candidate/resume')
  async downloadCandidateResume(
    @Res() response: Response,
    @GetUser() user: User,
    @Body() body: { resumeId: string },
  ) {
    const pdf = await this.jobPortalService.downloadCandidateResume(
      body.resumeId,
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment');
    response.end(pdf);
  }

  @UseGuards(ClerkAuthGuard)
  @Delete('/employer/job/delete/:id')
  async deleteSpecificJobPostingForEmployer(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.jobPortalService.deleteSpecificJobForEmployer(user.id, id);
  }

  // Candidate
  @UseGuards(ClerkAuthGuard)
  @Get('/candidate/job')
  async getAllJobPosting() {
    return this.jobPortalService.getAllJobs();
  }

  @UseGuards(ClerkAuthGuard)
  @Post('/candidate/job/:id')
  async createJobApplicationForCandidate(
    @Param('id') jobId: string,
    @GetUser() user: User,
    @Body() body: { resume_id: string },
  ) {
    return this.jobPortalService.createJobApplicationForCandidate(
      user.id,
      body.resume_id,
      jobId,
    );
  }

  @UseGuards(ClerkAuthGuard)
  @Delete('/candidate/job/:id')
  async withdrawJobApplicationForCandidate(
    @Param('id') jobId: string,
    @GetUser() user: User,
  ) {
    return this.jobPortalService.withdrawJobApplicationForCandidate(
      user.id,
      jobId,
    );
  }
}
