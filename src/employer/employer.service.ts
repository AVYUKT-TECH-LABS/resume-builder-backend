import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailSignupDto } from './dto/email.signup.dto';

@Injectable()
export class EmployerService {
  constructor(private prismaService: PrismaService) {}

  async createEmployeeWithoutCompany(data: EmailSignupDto) {
    return this.prismaService.employer.create({
      data,
    });
  }

  async findEmployeeByEmail(email: string) {
    return this.prismaService.employer.findFirst({
      where: {
        email,
      },
    });
  }
}
