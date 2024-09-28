import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

import { Request } from 'express';
import { UserJwtAuthGuard } from 'src/guards/user.auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(UserJwtAuthGuard)
  async test(@Req() req: Request) {
    console.log(req.user);
    return 'ok';
  }

  @Get('/jobs')
  async getJobs() {
    return this.usersService.getJobs();
  }
}
