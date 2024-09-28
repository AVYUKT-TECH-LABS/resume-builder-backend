import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmployerService } from './employer.service';

import { Request } from 'express';
import { EmployerJwtAuthGuard } from 'src/guards/employer.auth.guard';
import { OnboardingGuard } from 'src/guards/employer.on-boarding.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { OnBoardingDto } from './dto/onBoardDto.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@ApiTags('Employer')
@Controller('employer')
export class EmployerController {
  constructor(private readonly employerService: EmployerService) {}

  @Get('/verify')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async verify() {
    return {
      success: true,
      message: 'Verified',
    };
  }

  @Get()
  @UseGuards(EmployerJwtAuthGuard)
  async checkOnBoarding(@Req() req: Request) {
    if (!req.employer.organization_id) {
      return {
        success: false,
        message: 'Kindly complete on-boarding first!',
      };
    }

    return {
      success: true,
      message: 'On-boarding already done',
    };
  }

  @Post('/on-boarding')
  @UseGuards(EmployerJwtAuthGuard)
  async onBoard(@Req() req: Request, @Body() body: OnBoardingDto) {
    if (req.employer.organization_id) {
      throw new UnauthorizedException('On-boarding already done!');
    }

    await this.employerService.createOrg(body, req.employer.id);

    return {
      success: true,
      message: 'On-boarding done!',
    };
  }

  @Get('/jobs')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async getJobs(@Req() req: Request) {
    return this.employerService.getJobs(req.employer.id);
  }

  @Get('/job/:id')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async getJob(@Req() req: Request, @Param('id') id: string) {
    return this.employerService.getJob(req.employer.id, id);
  }

  @Patch('/job/update/:id')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async updateJob(
    @Req() req: Request,
    @Body() body: UpdateJobDto,
    @Param('id') id: string,
  ) {
    return this.employerService.updateJob(req.employer.id, body, id);
  }

  @Delete('/job/delete/:id')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async deleteJob(@Req() req: Request, @Param('id') id: string) {
    return this.employerService.deleteJob(req.employer.id, id);
  }

  @Post('/job')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async addJob(@Req() req: Request, @Body() body: CreateJobDto) {
    return this.employerService.addJob(req.employer.id, body);
  }

  @Get('/job/candidates/:jobId')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async getCandidates(@Req() req: Request, @Param('jobId') jobId: string) {
    return this.employerService.getCandidates(req.employer.id, jobId);
  }

  @Patch('/job/candidates/:id')
  @UseGuards(EmployerJwtAuthGuard)
  @UseGuards(OnboardingGuard)
  async updateCandidateApplication(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateJobApplicationDto,
  ) {
    return this.employerService.updateCandidateApplication(
      req.employer.id,
      id,
      body,
    );
  }
}
