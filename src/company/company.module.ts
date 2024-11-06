import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [PrismaModule, JwtModule],
    controllers: [CompanyController],
    providers: [CompanyService],
})
export class CompanyModule { }
