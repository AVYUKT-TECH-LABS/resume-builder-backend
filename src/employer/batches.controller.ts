import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  InternalServerErrorException,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { EmployerJwtAuthGuard } from '../guards/employer.auth.guard';
import { EmployerService } from './employer.service';
import { BatchUploadDTO } from './dto/batch.dto';

@Controller('employer/batch')
export default class EmployerBatchController {
  private readonly logger: Logger = new Logger(EmployerBatchController.name);
  constructor(private readonly employerService: EmployerService) {}

  @UseGuards(EmployerJwtAuthGuard)
  @Post('create')
  async createBatch(@Req() req: Request) {
    try {
      const batch = await this.employerService.createBatch(req.employer.id);

      return {
        batch_id: batch.id,
      };
    } catch (err) {
      this.logger.log(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to create batch.',
      });
    }
  }

  @UseGuards(EmployerJwtAuthGuard)
  @Get(':id')
  async getBatch(@Param('batchId') batchId: string, @Req() req: Request) {
    return this.employerService.getBatch(batchId, req.employer.id);
  }

  @UseGuards(EmployerJwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 100))
  @Post('upload')
  async upload(
    @Req() req: Request,
    @Body() body: BatchUploadDTO,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50000000 }),
          new FileTypeValidator({
            fileType:
              /(application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)/,
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    try {
      if (!files) {
        throw new BadRequestException('No file uploaded');
      } else if (!body.batchId || body.batchId.length == 0) {
        throw new BadRequestException('No batchId found');
      }

      const employerId = req.employer.id;

      const uploads = await this.employerService.uploadBatchResumes(
        employerId,
        body.batchId,
        files,
      );

      return uploads;
    } catch (err) {
      console.log(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to upload resume');
    }
  }
}