import { User } from '@clerk/clerk-sdk-node';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../decorators/user.decorator';
import { CandidateJwtAuthGuard } from '../guards/candidate.auth.guard';
import { LinkedinOptimizerService } from './linkedin-optimizer.service';

@Controller('linkedin-optimizer')
export class LinkedinOptimizerController {
  private logger: Logger = new Logger(LinkedinOptimizerController.name);
  constructor(
    private readonly linkedinOptimizerService: LinkedinOptimizerService,
  ) {}

  @UseGuards(CandidateJwtAuthGuard)
  @Get('scan/:uploadId')
  async scanProfile(
    @Param('uploadId') uploadId: string,
    @GetUser() user: User,
  ) {
    try {
      const hasEnoughCredits = await this.linkedinOptimizerService.hasCredits(
        user.id,
        50,
      );
      if (!hasEnoughCredits) throw new ForbiddenException('Not enough credits');
      const scanResults = await this.linkedinOptimizerService.scan(
        uploadId,
        user.id,
      );

      return scanResults;
    } catch (err) {
      this.logger.error(err);
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof ForbiddenException
      )
        throw err;
      throw new InternalServerErrorException(
        'Failed to scan your profile. Please try again',
      );
    }
  }
}
