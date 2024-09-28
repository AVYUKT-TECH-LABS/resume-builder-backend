import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CandidateJwtAuthGuard } from 'src/guards/candidate.auth.guard';
import { CandidateService } from './candidate.service';
import { JobsService } from '../jobs/jobs.service';

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

    const aggregatedJobs = await this.aggJobs.get();

    const merged = [...jobs, ...aggregatedJobs];
    for (let i = merged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [merged[i], merged[j]] = [merged[j], merged[i]];
    }
    return merged;
  }

  @Get('/job/:id')
  async getJob(@Param('id') id: string) {
    return this.candidateService.getJob(id);
  }

  @Get('/applications')
  @UseGuards(CandidateJwtAuthGuard)
  async getApplications(@Req() req: Request) {
    return this.candidateService.getApplications(req.candidate.id);
  }
}
