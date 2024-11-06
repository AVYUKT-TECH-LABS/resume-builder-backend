import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { JwtModule } from '@nestjs/jwt';
import { CloudModule } from 'src/cloud/cloud.module';

@Module({
    imports: [PrismaModule, JwtModule, CloudModule],
    controllers: [CompanyController],
    providers: [CompanyService],
})
export class CompanyModule { }
