import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CandidateJwtAuthGuard } from '../guards/candidate.auth.guard';
import { ClerkAuthGuard } from '../guards/clerk.guard';
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

  // @Get()
  // async update() {
  //   return this.resumeService.updatePreviews();
  // }

  // @Post('get_rec')
  // async getRec(@Body() body: { jd: string }) {
  //   return this.resumeService.getRec(body.jd);
  // }

  @UseGuards(CandidateJwtAuthGuard)
  @Get('list')
  async allResumes(@Req() req: Request) {
    try {
      const resumes = await this.resumeService.getAll(req.candidate.id);
      return resumes;
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to get resumes. Please try again!',
      );
    }
  }

  @Get('print/:resumeId')
  async printableResume(@Param('resumeId') resumeId: string) {
    try {
      const resume = await this.resumeService.get(resumeId);
      return resume;
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to get resume. Please try again!',
      );
    }
  }

  @UseGuards(CandidateJwtAuthGuard)
  @Post('download')
  async download(
    @Body() body: { resumeId: string },
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      const hasEnoughCredits = await this.resumeService.hasCredits(
        req.candidate.id,
        30,
      );
      if (!hasEnoughCredits) throw new ForbiddenException('Not enough credits');
      const pdf = await this.resumeService.download(
        body.resumeId,
        req.candidate.id,
      );
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader('Content-Disposition', 'attachment');
      response.end(pdf);
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to download resume');
    }
  }

  @UseGuards(CandidateJwtAuthGuard)
  @Get('read/:resumeId')
  async getResume(@Param('resumeId') resumeId: string, @Req() req: Request) {
    try {
      const resume = await this.resumeService.get(resumeId, req.candidate.id);
      return resume;
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to get resume. Please try again!',
      );
    }
  }

  @UseGuards(CandidateJwtAuthGuard)
  @Post('create')
  async createResume(@Req() req: Request, @Body() resumeData: CreateResumeDTO) {
    try {
      const isCreated = await this.resumeService.create(
        resumeData,
        req.candidate.id,
      );

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

  @UseGuards(CandidateJwtAuthGuard)
  @Post('existing/create')
  async createFromExistingResume(
    @Req() req: Request,
    @Body() { uploadId }: { uploadId: string },
  ) {
    try {
      const isCreated = await this.resumeService.generateFromExisting(uploadId);

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

  @UseGuards(CandidateJwtAuthGuard)
  @Patch('update/:resumeId')
  async saveResume(
    @Param('resumeId') resumeId: string,
    @Req() req: Request,
    @Body() resumeData: UpdateResumeDTO,
  ) {
    try {
      const isUpdated = await this.resumeService.save(
        resumeId,
        resumeData,
        req.candidate.id,
      );

      if (!isUpdated) return 'Failed to save resume';

      this.resumeService.createPreview(resumeId);

      return 'Resume Saved';
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to save resume. Please try again!',
      );
    }
  }

  @UseGuards(CandidateJwtAuthGuard)
  @Delete('delete/:resumeId')
  async delete(@Param('resumeId') resumeId: string, @Req() req: Request) {
    try {
      await this.resumeService.delete(resumeId, req.candidate.id);
      return 'deleted';
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(
        'Failed to save resume. Please try again!',
      );
    }
  }

  @UseGuards(CandidateJwtAuthGuard)
  @Post('domainSpecific/:upload_id')
  async domainSpecific(
    @Req() req: Request,
    @Param('upload_id') upload_id: string,
    @Body('domains') domains: string[],
  ) {
    try {
      const hasEnoughCredits = await this.resumeService.hasCredits(
        req.candidate.id,
        30 * domains.length,
      );
      if (!hasEnoughCredits) throw new ForbiddenException('Not enough credits');
      return this.resumeService.generateDomainSpecific(upload_id, domains);
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(CandidateJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('picture/upload')
  async uploadPicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50000000 })],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    try {
      const url = await this.resumeService.handlePictureUpload(
        req.candidate.id,
        file,
      );

      return url;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException(
        'Failed to upload image...Please try again',
      );
    }
  }

  @UseGuards(ClerkAuthGuard)
  @Post('write-with-ai')
  async writeWithAI(@Body() body: { content: string }) {
    try {
      const { content } = await this.resumeService.writeWithAI(body.content);
      return content;
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to improve text...please try again',
      );
    }
  }

  @Post('existing/upload')
  @UseGuards(CandidateJwtAuthGuard)
  async uploadExistingResume(
    @Req() req: Request,
    @Body() body: { resumeId: string },
  ) {
    try {
      if (!body.resumeId) {
        throw new BadRequestException('No resume selected');
      }

      const userId = req.candidate.id;
      const pdfBuffer = await this.resumeService.download(
        body.resumeId,
        userId,
        true,
      );

      // Convert Uint8Array to Buffer
      const buffer = Buffer.from(pdfBuffer);

      // Create a mock Express.Multer.File object from the buffer
      const mockFile: Express.Multer.File = {
        buffer: buffer,
        originalname: `resume_${body.resumeId}.pdf`,
        mimetype: 'application/pdf',
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      return this.legacyResumeService.uploadResume(userId, mockFile);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to upload resume');
    }
  }
}
