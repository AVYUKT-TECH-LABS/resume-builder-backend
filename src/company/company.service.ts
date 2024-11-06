import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CloudService } from 'src/cloud/cloud.service';

@Injectable()
export class CompanyService {
    constructor(private prismaService: PrismaService, private cloud: CloudService) { }

    async getCompany(id: string) {
        return this.prismaService.organization.findFirst({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                logo_url: true,
                description: true,
                city: true,
                industry: true,
                num_employees: true,
                website: true,
                map_url: true,
                accreditions: true,
                coverImg: true,
                jobs: {
                    select: {
                        id: true,
                        company_name: true,
                        job_title: true,
                        work_location_type: true,
                        office_address: true,
                        fixed_salary: true,
                        experience_level: true,
                    },
                    where: {
                        is_deleted: false,
                        status: 'active',
                    },
                },
                employers: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        hasImage: true,
                    },
                    where: {
                        banned: false,
                        locked: false,
                        is_deleted: false,
                        // is_verified: true
                    },
                },
                org_social_links: {
                    select: {
                        facebook: true,
                        instagram: true,
                        youtube: true,
                        twitter: true,
                    },
                    where: {
                        organization_id: id,
                    },
                },
                org_reviews: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                imageUrl: true,
                            }
                        }
                    },
                    take: 5,
                    skip: 0,
                }
            },
        });
    }

    async getJobs(id: string) {
        const orgDetails = await this.prismaService.organization.findFirst({
            where: {
                id,
            },
            select: {
                name: true,
            },
        });

        const jobDetails = await this.prismaService.job.findMany({
            where: {
                Organization: {
                    id,
                },
                is_deleted: false,
                status: 'active',
            },
            select: {
                id: true,
                company_name: true,
                job_title: true,
                work_location_type: true,
                office_address: true,
                fixed_salary: true,
                experience_level: true,
            },
        });

        return {
            company: orgDetails,
            details: jobDetails,
        };
    }

    async updateOrg(body: Prisma.OrganizationUpdateInput, organization_id: string, employer_id: string) {
        return this.prismaService.organization.update({
            where: {
                employers: {
                    some: {
                        id: employer_id
                    }
                },
                id: organization_id
            },
            data: body
        })
    }

    async uploadDoc(file: Express.Multer.File, documentType: string) {
        const fileName = `${randomUUID()}-doc`;

        const storage = this.cloud.getStorageService();

        const documentUrl = await storage.uploadFile(file, fileName, 'txcl-org-docs')

        const document = await this.prismaService.orgDocs.create({
            data: {
                documentType,
                documentUrl
            }
        })

        return { documentUrl, documentId: document.id };
    }
}
