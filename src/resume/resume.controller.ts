import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../decorators/user.decorator';
import { ClerkAuthGuard } from '../guards/clerk.guard';
import { User } from '../interfaces/user.interface';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResumeService } from './resume.service';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Resume } from '../schemas/resume.schema';

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
  create(@Body() createResumeDto: CreateResumeDto, @GetUser() user: User) {
    return this.resumeService.create(createResumeDto, user.id);
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
  update(@Param('id') id: string, @Body() updateResumeDto: UpdateResumeDto) {
    return this.resumeService.update(+id, updateResumeDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.resumeService.remove(+id);
  }
}
