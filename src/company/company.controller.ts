import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { EmployerJwtAuthGuard } from 'src/guards/employer.auth.guard';
import { Request } from "express";
@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Get('/:id')
    async getCompany(@Param('id') id: string) {
        return this.companyService.getCompany(id);
    }

    @Get('jobs/:id')
    async getJobs(@Param('id') id: string) {
        return this.companyService.getJobs(id);
    }


    @Patch('update')
    @UseGuards(EmployerJwtAuthGuard)
    async updateOrganization(@Body() body: any, @Req() req: Request) {
        await this.companyService.updateOrg(body, req.employer.organization_id, req.employer.id)
        return 'ok'
    }
}
