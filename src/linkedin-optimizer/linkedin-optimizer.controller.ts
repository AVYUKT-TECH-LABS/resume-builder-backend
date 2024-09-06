import { User } from '@clerk/clerk-sdk-node';
import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../decorators/user.decorator';
import { ClerkAuthGuard } from '../guards/clerk.guard';
import { LinkedinOptimizerService } from './linkedin-optimizer.service';

@Controller('linkedin-optimizer')
export class LinkedinOptimizerController {
  private logger: Logger = new Logger(LinkedinOptimizerController.name);
  constructor(
    private readonly linkedinOptimizerService: LinkedinOptimizerService,
  ) {}

  @UseGuards(ClerkAuthGuard)
  @Get('scan/:uploadId')
  async scanProfile(
    @Param('uploadId') uploadId: string,
    @GetUser() user: User,
  ) {
    try {
      const scanResults = await this.linkedinOptimizerService.scan(
        uploadId,
        user.id,
      );

      return scanResults;
    } catch (err) {
      this.logger.error(err);
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      )
        throw err;
      throw new InternalServerErrorException(
        'Failed to scan your profile. Please try again',
      );
    }
  }
}
