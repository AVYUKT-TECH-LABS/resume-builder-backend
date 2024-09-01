import { User } from '@clerk/clerk-sdk-node';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../decorators/user.decorator';
import { ClerkAuthGuard } from '../guards/clerk.guard';
import { hasCredits } from '../utils/credits';
import { CreateResumeDTO, UpdateResumeDTO } from './dto/resumev2.dto';
import { ResumeService } from './resume.service';
import { ResumeServiceV2 } from './resumev2.service';

@ApiBearerAuth()
@ApiTags('Resume')
@Controller({
  path: 'resume',
  version: '2',
})
export default class ResumeControllerV2 {
  private readonly logger: Logger = new Logger(ResumeControllerV2.name);
  constructor(
    private resumeService: ResumeServiceV2,
    private legacyResumeService: ResumeService,
  ) {}

  @UseGuards(ClerkAuthGuard)
  @Get('list')
  async allResumes(@GetUser() user: User) {
    try {
      const resumes = await this.resumeService.getAll(user.id);
      return resumes;
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to get resumes. Please try again!',
      );
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Get('read/:resumeId')
  async getResume(@Param('resumeId') resumeId: string, @GetUser() user: User) {
    try {
      const resume = await this.resumeService.get(resumeId, user.id);
      return resume;
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to get resume. Please try again!',
      );
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Post('create')
  async createResume(
    @GetUser() user: User,
    @Body() resumeData: CreateResumeDTO,
  ) {
    try {
      const hasEnoughCredits = await hasCredits(user.id, 30);
      if (!hasEnoughCredits) throw new ForbiddenException('Not enough credits');
      const isCreated = await this.resumeService.create(resumeData, user.id);

      if (!isCreated) return 'Failed to save resume';

      return {
        _id: isCreated._id,
      };
    } catch (err) {
      this.logger.error(err);
      if (
        err instanceof BadRequestException ||
        err instanceof ForbiddenException
      )
        throw err;
      throw new InternalServerErrorException(
        'Failed to save resume. Please try again!',
      );
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Patch('update/:resumeId')
  async saveResume(
    @Param('resumeId') resumeId: string,
    @GetUser() user: User,
    @Body() resumeData: UpdateResumeDTO,
  ) {
    try {
      const isUpdated = await this.resumeService.save(
        resumeId,
        resumeData,
        user.id,
      );

      if (!isUpdated) return 'Failed to save resume';

      return 'Resume Saved';
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to save resume. Please try again!',
      );
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Delete('delete/:resumeId')
  async delete(@Param('resumeId') resumeId: string, @GetUser() user: User) {
    try {
      await this.resumeService.delete(resumeId, user.id);
      return 'deleted';
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to save resume. Please try again!',
      );
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Post('domainSpecific/:upload_id')
  async domainSpecific(
    @Param('upload_id') upload_id: string,
    @Body('domains') domains: string[],
    @GetUser() user: User,
  ) {
    try {
      const hasEnoughCredits = await hasCredits(user.id, 30 * domains.length);
      if (!hasEnoughCredits) throw new ForbiddenException('Not enough credits');
      return this.resumeService.generateDomainSpecific(upload_id, domains);
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Post('write-with-ai')
  async writeWithAI() {}
}
