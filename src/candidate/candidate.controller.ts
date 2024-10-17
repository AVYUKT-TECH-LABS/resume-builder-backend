import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { CreateJobPreferenceDto, UpdateJobPreferenceDto } from './dro/pref.dto';

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
  @Get('/aggregated/jobs/list')
  async getAggJobs() {
    const aggregatedJobs = await this.aggJobs.get();

    return aggregatedJobs;
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

  @UseGuards(CandidateJwtAuthGuard)
  @Post('preferences/create')
  async createPreferences(
    @Body() createJobPreferenceDto: CreateJobPreferenceDto,
    @Req() { candidate }: Request,
  ) {
    return this.candidateService.createPreferences(
      createJobPreferenceDto,
      candidate.id,
    );
  }

  @UseGuards(CandidateJwtAuthGuard)
  @Patch('preferences/update/')
  async updatePreferences(
    @Body() updateJobPreferenceDto: UpdateJobPreferenceDto,
    @Req() { candidate }: Request,
  ) {
    return this.candidateService.updatePreferences(
      updateJobPreferenceDto,
      candidate.id,
    );
  }
}
