import { Controller, Get, Query } from '@nestjs/common';
import { CandidateService } from './candidate.service';

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
}
