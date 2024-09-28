import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Query,
} from '@nestjs/common';
import { CandidatesDatabaseService } from './candidates-database.service';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

@Controller('candidates')
export class CandidatesDatabaseController {
  private logger: Logger = new Logger(CandidatesDatabaseController.name);
  constructor(private candidatesDBService: CandidatesDatabaseService) {}

  @Get('recommended/:jobId')
  async getRecommended(
    @Param('jobId') jobId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ): Promise<PaginatedResponse<any>> {
    try {
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(pageSize, 10);

      if (
        isNaN(pageNumber) ||
        isNaN(pageSizeNumber) ||
        pageNumber < 1 ||
        pageSizeNumber < 1
      ) {
        throw new BadRequestException('Invalid page or pageSize parameters');
      }

      const { results, pagination } =
        await this.candidatesDBService.getRecommendedCandidatesForJob(
          jobId,
          pageNumber,
          pageSizeNumber,
        );

      return {
        data: results,
        pagination,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  @Get('search')
  async searchCandidates(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ): Promise<PaginatedResponse<any>> {
    try {
      const pageNumber = parseInt(page, 10);
      const pageSizeNumber = parseInt(pageSize, 10);

      if (
        isNaN(pageNumber) ||
        isNaN(pageSizeNumber) ||
        pageNumber < 1 ||
        pageSizeNumber < 1
      ) {
        throw new BadRequestException('Invalid page or pageSize parameters');
      }

      const { results, pagination } = await this.candidatesDBService.search(
        query,
        pageNumber,
        pageSizeNumber,
      );

      return {
        data: results,
        pagination,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error);
    }
  }
}
