import { Request, Response } from 'express';

import {
    BadRequestException, Body, Controller, Delete, ForbiddenException, Get,
    InternalServerErrorException, Logger, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post,
    Query, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

import { EmployerJwtAuthGuard } from '../guards/employer.auth.guard';
import { DashboardData } from '../types';
import { CreateJobDto } from './dto/create-job.dto';
import { OnBoardingDto } from './dto/onBoardDto.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { EmployerService } from './employer.service';

@ApiTags('Employer')
@Controller('employer')
export class EmployerController {
  private logger: Logger = new Logger(EmployerController.name);
  constructor(private readonly employerService: EmployerService) {}

  @Get('/verify')
  @UseGuards(EmployerJwtAuthGuard)
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

  @Post('/upload')
  @UseGuards(EmployerJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrgLogo(
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50000000 })],
      }),
    )
    file: Express.Multer.File,
    @Body('type') uploadType: string,
  ) {
    const url = await this.employerService.uploadOrgLogo(
      req.employer.id,
      file,
      uploadType,
    );

    return {
      success: true,
      upload_url: url,
    };
  }

  @Get('/jobs')
  @UseGuards(EmployerJwtAuthGuard)
  async getJobs(@Req() req: Request) {
    return this.employerService.getJobs(req.employer.organization_id);
  }

  @Get('/job/:id')
  @UseGuards(EmployerJwtAuthGuard)
  async getJob(@Req() req: Request, @Param('id') id: string) {
    return this.employerService.getJob(req.employer.organization_id, id);
  }

  @Patch('/job/update/:id')
  @UseGuards(EmployerJwtAuthGuard)
  async updateJob(
    @Req() req: Request,
    @Body() body: UpdateJobDto,
    @Param('id') id: string,
  ) {
    return this.employerService.updateJob(
      req.employer.organization_id,
      body,
      id,
    );
  }

  @Delete('/job/delete/:id')
  @UseGuards(EmployerJwtAuthGuard)
  async deleteJob(@Req() req: Request, @Param('id') id: string) {
    return this.employerService.deleteJob(req.employer.organization_id, id);
  }

  @Post('/job/invite/:id')
  @UseGuards(EmployerJwtAuthGuard)
  async inviteCandidates(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { candidates: string[] },
  ) {
    return this.employerService.inviteCandidates(
      req.employer.organization_id,
      id,
      body.candidates,
    );
  }

  @Post('/job')
  @UseGuards(EmployerJwtAuthGuard)
  async addJob(@Req() req: Request, @Body() body: CreateJobDto) {
    return this.employerService.addJob(req.employer.id, body);
  }

  @Get('/job/candidates/:jobId')
  @UseGuards(EmployerJwtAuthGuard)
  async getCandidates(@Req() req: Request, @Param('jobId') jobId: string) {
    return this.employerService.getCandidates(
      req.employer.organization_id,
      jobId,
    );
  }

  @Patch('/job/candidate/update/:jobId')
  @UseGuards(EmployerJwtAuthGuard)
  async updateCandidateApplication(
    @Req() req: Request,
    @Param('jobId') jobId: string,
    @Body() body: UpdateJobApplicationDto,
  ) {
    return this.employerService.updateCandidateApplication(
      req.employer.organization_id,
      jobId,
      body,
    );
  }

  @Post('/download')
  @UseGuards(EmployerJwtAuthGuard)
  async download(
    @Req() req: Request,
    @Body() body: { resumeId: string },
    @Res() response: Response,
  ) {
    try {
      const pdf = await this.employerService.download(body.resumeId);
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', 'attachment');
      response.end(pdf);
    } catch (err) {
      this.logger.log(err);
      if (err instanceof BadRequestException) throw err;
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to download resume');
    }
  }

  @UseGuards(EmployerJwtAuthGuard)
  @Get('/dashboard')
  async getDashboard(@Req() { employer }: Request): Promise<DashboardData> {
    try {
      const dashboard = await this.employerService.getDashboard(employer.id);

      return dashboard;
    } catch (err) {
      throw err;
    }
  }
}
