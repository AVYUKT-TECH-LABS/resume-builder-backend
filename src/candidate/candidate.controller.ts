import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CandidateJwtAuthGuard } from '../guards/candidate.auth.guard';
import { CandidateService } from './candidate.service';

@ApiTags('Candidate')
@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get('/jobs')
  async getJobs(
    @Query('search') search?: string,
    @Query('salary') salary?: string,
    @Query('jobType') jobType?: string,
    @Query('workExperience') workExperience?: string,
  ) {
    return this.candidateService.getJobs({
      search,
      salary,
      jobType: jobType ? jobType.split(', ') : undefined,
      workExperience: workExperience ? workExperience.split(', ') : undefined,
    });
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
