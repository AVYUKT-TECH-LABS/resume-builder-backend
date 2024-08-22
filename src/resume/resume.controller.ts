import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Headers,
  InternalServerErrorException,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import axios from 'axios';
import { GetUser } from '../decorators/user.decorator';
import { ClerkAuthGuard } from '../guards/clerk.guard';
import { User } from '../interfaces/user.interface';
import { Resume } from '../schemas/resume.schema';
import { Resume as ResumeType } from '../types/index';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResumeService } from './resume.service';

@ApiBearerAuth()
@ApiTags('Resume')
@Controller('resume')
@UseGuards(ClerkAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('create')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create resume (CreateResumeDTO)' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 201, description: 'Created' })
  create(@GetUser() user: User) {
    return this.resumeService.create(user.id);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all resumes of a user' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 200,
    description: 'Created',
    type: Resume,
    example: [
      {
        _id: 'Resume Id',
        name: 'Resume Name',
        createdAt: 'Creation Date',
        updatedAt: 'Last Updated Date',
      },
    ],
  })
  findAll(@GetUser() user: User) {
    return this.resumeService.findAll(user.id);
  }

  @Get('read/:id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.resumeService.findOne(id, user.id);
  }

  @Patch('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
    @GetUser() user: User,
  ) {
    return this.resumeService.update(id, updateResumeDto, user.id);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.resumeService.remove(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const userId = user.id;

      return this.resumeService.uploadResume(userId, file);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to upload resume');
    }
  }

  @Post('uploadAndCreate')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndCreate(
    @Headers() headers,
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/upload',
        formData,
        {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      const resumeData = response.data as ResumeType;

      //create resume
      const new_resume = await this.resumeService.createFromData(
        user.id,
        resumeData,
        file.originalname,
      );

      return new_resume._id;
    } catch (error) {
      console.error('Error sending file to Flask API:', error);
      throw new BadRequestException('Failed to process the file');
    }
  }

  @Post('generateVariations')
  @UseInterceptors(FileInterceptor('file'))
  async generateVariations(
    @Headers() headers,
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const formData = new FormData();

    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append(
      'selectedDomains',
      JSON.stringify(['Frontend Developer', 'Devops']),
    );

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/forDomains',
        formData,
        {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      const { resumes } = response.data as { resumes: ResumeType[] };

      //create resumes
      resumes.forEach(
        async (resume) =>
          await this.resumeService.createFromData(
            user.id,
            resume,
            resume.id.replace('-', ' '),
          ),
      );

      return {
        code: 200,
        message: 'Resumes created',
      };
    } catch (error) {
      console.error('Error sending file to Flask API:', error);
      throw new BadRequestException('Failed to process the file');
    }
  }

  @Get('suggestDomains/:upload_id')
  async suggestDomains(@Param('upload_id') upload_id: string) {
    return this.resumeService.suggestDomains(upload_id);
  }

  @Post('domainSpecific/:upload_id')
  async domainSpecific(
    @Param('upload_id') upload_id: string,
    @Body('domains') domains: string[],
  ) {
    return this.resumeService.generateDomainSpecific(upload_id, domains);
  }

  @Get('analyse/:upload_id')
  async suggestions(@Param('upload_id') upload_id: string) {
    return this.resumeService.generateAnalyses(upload_id);
  }

  @Get('getPdf/:upload_id')
  async getResumePdf(@Param('upload_id') upload_id: string) {
    return this.resumeService.getPdf(upload_id);
  }
}
