import { Body, Controller, Get, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompanyService } from './company.service';
import { EmployerJwtAuthGuard } from 'src/guards/employer.auth.guard';
import { Request } from "express";
import { FileInterceptor } from '@nestjs/platform-express';
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

    @Post('/upload-doc')
    @UseGuards(EmployerJwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadOrgLogo(
        @Req() req: Request,
        @Body() body: any,
        @UploadedFile(
            new ParseFilePipe({
                validators: [new MaxFileSizeValidator({ maxSize: 50000000 })],
            }),
        )
        file: Express.Multer.File,
    ) {
        const document = await this.companyService.uploadDoc(file, body.documentType);

        return {
            success: true,
            ...document
        };
    }
}
