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
    ) { }

    @Get('/jobs')
    async getJobs(
        @Query('search') search?: string,
        @Query('experience') experience?: string | string[],
        @Query('job_type') jobType?: string | string[],
        @Query('location') location?: string | string[],
        @Query('min_edu') minEducation?: string | string[],
        @Query('salary') salary?: string | string[],
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        const normalizeToArray = (
            value: string | string[] | undefined,
        ): string[] => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        };

        const workExperience = normalizeToArray(experience);
        const jobTypes = normalizeToArray(jobType);
        const locations = normalizeToArray(location);
        const educationLevels = normalizeToArray(minEducation);
        const salaryRange = normalizeToArray(salary);

        const { data: jobs, meta } = await this.candidateService.getJobs({
            search,
            salary: salaryRange,
            jobType: jobTypes,
            workExperience,
            location: locations,
            minEducation: educationLevels,
            page: Number(page),
            limit: Number(limit),
        });

        return {
            data: jobs,
            meta: {
                ...meta,
                currentPage: page,
                itemsPerPage: limit,
            }
        };
    }


    @Get('/aggregated/jobs/list')
    async getAggJobs(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        const {data: aggregatedJobs, meta} = await this.aggJobs.get({
            page: Number(page),
            limit: Number(limit),
        });

        return {
            data: aggregatedJobs,
            meta: {
                ...meta,
                currentPage: page,
                itemsPerPage: limit,
            }
        };
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
