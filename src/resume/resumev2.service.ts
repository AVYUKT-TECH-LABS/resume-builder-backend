import { Injectable, NotFoundException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudService } from '../cloud/cloud.service';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import _puppeteer from '../puppeteer';
import { ResumeV2 } from '../schemas/resume.schema.v2';
import { Upload } from '../schemas/upload.schema';
import shortId from '../utils/shortid';
import { CreateResumeDTO, UpdateResumeDTO } from './dto/resumev2.dto';

const defaults = {
  pageConfig: {
    size: 'A4',
    background: null,
    margin: 6,
    spacing: 0,
    font: {
      fontFamily:
        '__Playfair_Display_e3a538, __Playfair_Display_Fallback_e3a538',
      fontStyle: 'normal',
    },
    fontSizes: {
      heading: 0,
      subHeading: 0,
      content: 16,
      lineHeight: 1.7,
    },
    colors: {
      primary: '#296d98',
      background: '#ffffff',
      text: '#000000',
    },
    template: 'clarity',
  },
  picture: {
    available: false,
    enabled: true,
    url: 'https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352010-stock-illustration-default-placeholder-man-and-woman.jpg',
    size: 120,
    radius: 20,
    border: false,
    grayscale: false,
  },
};
@Injectable()
export class ResumeServiceV2 {
  constructor(
    @InjectModel(ResumeV2.name) private resumeModel: Model<ResumeV2>,
    @InjectModel(Upload.name) private uploadModel: Model<Upload>,
    // private config: ConfigService,
    private openai: OpenAiService,
    private cloud: CloudService,
    private prismaService: PrismaService,
  ) {}

  async get(resumeId: string, userId?: string | undefined) {
    try {
      const resume = await this.resumeModel.findOne(
        {
          _id: resumeId,
          ...(userId && { userId }),
        },
        {
          embeddings: 0,
          plainText: 0,
        },
      );

      if (!resume) throw new NotFoundException('Resume not found');

      return resume;
    } catch (err) {
      throw err;
    }
  }

  async getAll(userId: string) {
    try {
      const resumes = await this.resumeModel.find(
        {
          userId,
        },
        {
          'pageConfig.colors.primary': 1,
          'sections.personalInformation.title': 1,
          createdAt: 1,
          updatedAt: 1,
        },
      );

      if (!resumes) throw new NotFoundException('Resumes not found');

      return resumes;
    } catch (err) {
      throw err;
    }
  }

  async create(
    data: CreateResumeDTO,
    userId: string,
  ): Promise<
    ResumeV2 & {
      _id: Types.ObjectId;
    }
  > {
    try {
      const newResume = await this.resumeModel.create({
        userId,
        ...data,
      });

      return newResume;
    } catch (err) {
      console.log(err);
      throw 'Failed to create resume';
    }
  }

  async save(
    resumeId: string,
    data: UpdateResumeDTO,
    userId: string,
  ): Promise<ResumeV2> {
    try {
      const resume = await this.resumeModel.findOne({ _id: resumeId, userId });

      if (!resume) {
        throw new NotFoundException(
          'Resume not found or does not belong to the user',
        );
      }

      Object.assign(resume, data);
      await resume.save();

      return resume;
    } catch (error) {
      throw error;
    }
  }

  async delete(resumeId: string, userId: string) {
    try {
      const resume = await this.resumeModel.findOne({ _id: resumeId, userId });

      if (!resume) {
        throw new NotFoundException(
          'Resume not found or does not belong to the user',
        );
      }

      await resume.deleteOne();

      return;
    } catch (error) {
      throw error;
    }
  }

  async generateFromExisting(upload_id: string) {
    const uploaded = await this.uploadModel.findById(upload_id, {
      rawContent: 1,
      userId: 1,
    });

    const resume = await this.openai.resumeFromExisting(uploaded.rawContent);

    const embeddings = await this.openai.generateEmbeddings(resume.plainText);

    const created = await this.create(
      { ...defaults, ...resume, embeddings },
      uploaded.userId,
    );

    await this.createPreview(created._id as unknown as string);

    return created;
  }

  async generateDomainSpecific(upload_id: string, domains: string[]) {
    const uploaded = await this.uploadModel.findById(upload_id, {
      rawContent: 1,
      userId: 1,
    });

    const promises = domains.map(async (domain) => {
      const resume = await this.openai.resumeForDomain(
        uploaded.rawContent,
        domain,
        'v2',
      );

      //create embeddings
      const embeddings = await this.openai.generateEmbeddings(resume.plainText);

      const created = await this.create(
        { ...defaults, ...resume, embeddings },
        uploaded.userId,
      );

      await this.createPreview(created._id as unknown as string);

      return created;
    });

    await Promise.all(promises);
    return 'ok';
  }

  async handlePictureUpload(userId: string, file: Express.Multer.File) {
    // Generate a short ID for the file name
    const fileName = `${userId}-${shortId()}`;

    // Get the storage service
    const storage = this.cloud.getStorageService();

    const url = await storage.uploadFile(
      file,
      fileName,
      'txcl-resume-pictures',
    );

    return url;
  }

  async writeWithAI(content: string, isForJd: boolean = false) {
    return this.openai.improve(content, isForJd);
  }

  async download(resumeId: string, userId: string, existing: boolean = false) {
    // const resume = await this.get(resumeId, userId)
    const browser = await _puppeteer();
    const page = await browser.newPage();

    // Navigate to the dedicated Next.js PDF page
    const url = `${process.env.FRONTEND_URL}/pdf/${resumeId}`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    //   const customCSS = `
    //   <style>
    //     @page {
    //       margin-top: 1in;
    //       margin-bottom: 1in;
    //     }

    //     @page :first {
    //       margin-top: 0;
    //       margin-bottom:1in;
    //     }
    //   </style>
    // `;

    //   await page.addStyleTag({ content: customCSS });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      waitForFonts: true,
      preferCSSPageSize: true,
      // margin: {
      //   bottom: '1in',
      // }
    });

    await page.close();

    if (pdfBuffer && !existing) await this.deductCredits(userId, 30);

    return pdfBuffer;
  }

  async createPreview(resumeId: string) {
    const browser = await _puppeteer();
    const page = await browser.newPage();

    // Navigate to the dedicated Next.js PDF page
    const url = `${process.env.FRONTEND_URL}/pdf/${resumeId}`;

    try {
      await page.setViewport({
        width: 794,
        height: 1080,
        deviceScaleFactor: 1,
      });
      await page.goto(url, { waitUntil: 'networkidle0' });
      // Take the screenshot as a buffer instead of saving it locally
      const screenshotBuffer = await page.screenshot({ type: 'png' });
      const buffer = Buffer.from(screenshotBuffer);

      // Upload the screenshot buffer directly to S3
      const file: Express.Multer.File = {
        buffer: buffer,
        originalname: `${resumeId}.png`, // You can modify the filename as needed
        mimetype: 'image/png',
        size: screenshotBuffer.length,
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const cloud = this.cloud.getStorageService();
      await cloud.uploadFile(file, `${resumeId}.png`, 'txcl-resume-previews');
      await page.close();
      return;
    } catch (error) {
      console.error('An error occurred:', error);
      return;
    }
  }

  async updatePreviews() {
    try {
      // Fetch all resume IDs
      const resumes = await this.resumeModel.find({}, { _id: 1 });

      if (!resumes || resumes.length === 0) {
        throw new NotFoundException('Resumes not found');
      }

      // Create an array of promises to generate previews concurrently
      resumes.map(
        async (resume: any) => await this.createPreview(resume._id.toString()),
      );

      // Use Promise.all to run all createPreview functions in parallel
      // await Promise.all(createPreviewsPromises);
      return 'All previews generated successfully';
    } catch (err) {
      console.error('An error occurred while updating previews:', err);
      throw err;
    }
  }

  async hasCredits(userId: string, min: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: {
          id: userId,
        },
      });
      const credits = user.credits;
      if (credits && Number(credits) >= min) return true;
      return false;
    } catch (err) {
      throw err;
    }
  }

  async deductCredits(userId: string, amt: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: {
          id: userId,
        },
      });

      let currentCredits = user.credits;

      if (typeof currentCredits !== 'number') {
        currentCredits = 0;
      }

      if (Number(currentCredits) < amt) {
        throw new Error('Insufficient credits');
      }

      const newCredits = Number(currentCredits) - amt;

      await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: {
          credits: newCredits,
        },
      });

      return newCredits;
    } catch (err) {
      throw err;
    }
  }
}
