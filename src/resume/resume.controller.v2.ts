import { User } from '@clerk/clerk-sdk-node';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../decorators/user.decorator';
import { ClerkAuthGuard } from '../guards/clerk.guard';
import { CreateResumeDTO, UpdateResumeDTO } from './dto/resumev2.dto';
import { ResumeServiceV2 } from './resumev2.service';
import { hasCredits } from '../utils/credits';
import { ResumeService } from './resume.service';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('upload')
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50000000 }),
          new FileTypeValidator({
            fileType: 'application/pdf',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const userId = user.id || 'GUEST_USER';

      return this.legacyResumeService.uploadResume(userId, file);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to upload resume');
    }
  }

  @Post('uploadNoLogin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResumeWithoutLogin(
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50000000 }),
          new FileTypeValidator({
            fileType:
              /(application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const userId = 'GUEST_USER';

      return this.legacyResumeService.uploadResume(userId, file);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to upload resume');
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Get('suggestDomains/:upload_id')
  async suggestDomains(@Param('upload_id') upload_id: string) {
    return this.legacyResumeService.suggestDomains(upload_id);
  }

  @Get('analyse/:upload_id')
  async suggestions(
    @Param('upload_id') upload_id: string,
    @Query('isFree') isFree: string,
  ) {
    return this.legacyResumeService.generateAnalyses(upload_id, isFree);
  }
}
