import { Controller, Get } from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { ResumeV2 } from '../schemas/resume.schema.v2';
import { Model } from 'mongoose';

@Controller('migrations')
export class MigrationsController {
  constructor(
    private prisma: PrismaService,
    @InjectModel(ResumeV2.name) private resumeModel: Model<ResumeV2>,
  ) {}
  @Get('')
  async init() {
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100,
    });

    for (const clerkUser of clerkUsers.data) {
      if (!clerkUser) return;
      if (clerkUser.unsafeMetadata.userType == 'employer') {
        // Check if user already exists in your database
        const existingUser = await this.prisma.employer.findUnique({
          where: { email: clerkUser.emailAddresses[0]?.emailAddress },
        });

        if (!existingUser) {
          // Create new user in your database
          await this.prisma.employer.create({
            data: {
              email: clerkUser.emailAddresses[0]?.emailAddress,
              name: `${clerkUser.firstName} ${clerkUser.lastName}`,
              clerkId: clerkUser.id,
              provider: AuthProvider.EMAIL_PASSWORD,
            },
          });
        } else {
          // Update existing user with Clerk ID
          await this.prisma.employer.update({
            where: { id: existingUser.id },
            data: { clerkId: clerkUser.id },
          });
        }
      } else {
        // Check if user already exists in your database
        const existingUser = await this.prisma.user.findUnique({
          where: { email: clerkUser.emailAddresses[0]?.emailAddress },
        });

        if (!existingUser) {
          // Create new user in your database
          await this.prisma.user.create({
            data: {
              email: clerkUser.emailAddresses[0]?.emailAddress,
              name: `${clerkUser.firstName} ${clerkUser.lastName}`,
              clerkId: clerkUser.id,
              provider: AuthProvider.EMAIL_PASSWORD,
              credits: clerkUser.publicMetadata.credits as number,
            },
          });
        } else {
          // Update existing user with Clerk ID
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: { clerkId: clerkUser.id },
          });
        }
      }
    }

    console.log('Clerk users migration completed');
  }

  @Get('2')
  async step2() {
    try {
      // Fetch all users from your new auth system
      const newUsers = await this.prisma.user.findMany({
        where: { clerkId: { not: null } },
      });

      for (const user of newUsers) {
        console.log(user.email);
        // Update MongoDB documents
        await this.resumeModel.updateMany(
          { userId: user.clerkId },
          { $set: { userId: user.id } },
        );
      }

      console.log('MongoDB user references updated');
    } catch (error) {
      console.error('Error updating MongoDB references:', error);
    }
  }
}
