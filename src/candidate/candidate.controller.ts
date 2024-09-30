import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CandidateJwtAuthGuard } from '../guards/candidate.auth.guard';
import { JobsService } from '../jobs/jobs.service';
import { CandidateService } from './candidate.service';

@ApiTags('Candidate')
@Controller('candidate')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private aggJobs: JobsService,
  ) {}

  @Get('/jobs')
  async getJobs(
    @Query('search') search?: string,
    @Query('salary') salary?: string,
    @Query('jobType') jobType?: string,
    @Query('workExperience') workExperience?: string,
  ) {
    const jobs = await this.candidateService.getJobs({
      search,
      salary,
      jobType: jobType ? jobType.split(', ') : undefined,
      workExperience: workExperience ? workExperience.split(', ') : undefined,
    });

    // const aggregatedJobs = await this.aggJobs.get();

    // const merged = [...jobs, ...aggregatedJobs];
    // for (let i = merged.length - 1; i > 0; i--) {
    //   const j = Math.floor(Math.random() * (i + 1));
    //   [merged[i], merged[j]] = [merged[j], merged[i]];
    // }
    // return merged;

    return jobs;
  }

  @Get('/job/:id')
  async getJob(@Param('id') id: string) {
    return this.candidateService.getJob(id);
  }

  @Post('/job/:id')
  @UseGuards(CandidateJwtAuthGuard)
  async apply(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { resume_id: string },
  ) {
    return this.candidateService.apply(id, req.candidate.id, body.resume_id);
  }

  @Get('/applications')
  @UseGuards(CandidateJwtAuthGuard)
  async getApplications(@Req() req: Request) {
    return this.candidateService.getApplications(req.candidate.id);
  }
}
