import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { CloudService } from '../cloud/cloud.service';
import { OpenAiService } from '../openai/openai.service';
import { Resume } from '../schemas/resume.schema';
import { Upload } from '../schemas/upload.schema';
import { Resume as ResumeType } from '../types/index';
import { deductCredits } from '../utils/credits';
import shortId from '../utils/shortid';
import { UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumeService {
  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<Resume>,
    @InjectModel(Upload.name) private uploadModel: Model<Upload>,
    private cloud: CloudService,
    private openai: OpenAiService,
    private config: ConfigService,
  ) {}

  async create(userId: string) {
    try {
      const createdResume = new this.resumeModel({
        userId,
        name: '',
        page: {
          size: 'A4',
          background: null,
          margins: 10,
          spacing: 1,
        },
        template: 'ivy',
        font: '',
        color: '#000',
        resume: {
          id: 'resume-id',
          contact: {
            settings: [
              {
                key: 'showTitle',
                name: 'Show Title',
                value: true,
              },
              {
                key: 'showPhone',
                name: 'Show Phone',
                value: true,
              },
              {
                key: 'showLink',
                name: 'Show Link',
                value: true,
              },
              {
                key: 'showEmail',
                name: 'Show Email',
                value: true,
              },
              {
                key: 'showLocation',
                name: 'Show Location',
                value: true,
              },
            ],
            data: {
              name: '',
              title: '',
              phone: '',
              link: '',
              email: '',
              location: '',
            },
          },
          sections: [],
        },
      });

      const saved = createdResume.save();
      await deductCredits(userId, 30);

      return saved;
    } catch (err) {
      throw new InternalServerErrorException('Failed to create resume');
    }
  }

  findAll(userId: string) {
    return this.resumeModel
      .find(
        { userId },
        {
          createdAt: 1,
          updatedAt: 1,
          'resume.contact.data.title': 1,
          name: 1,
          _id: 1,
        },
      )
      .exec();
  }

  findOne(_id: string, userId: string) {
    return this.resumeModel
      .findOne({
        _id,
        userId,
      })
      .exec();
  }

  async update(id: string, updateResumeDto: UpdateResumeDto, user_id: string) {
    return await this.resumeModel
      .updateOne(
        {
          _id: id,
          userId: user_id,
        },
        updateResumeDto,
      )
      .exec();

    // return 'ok';
  }

  remove(id: string, userId: string) {
    return this.resumeModel.deleteOne({ _id: id, userId }).exec();
  }

  async createFromData(userId: string, resumeData: ResumeType, name: string) {
    await deductCredits(userId, 30);

    return this.resumeModel.create({
      userId,
      name,
      page: {
        background: null,
        margins: 1,
        size: 'A4',
        spacing: 12,
      },
      template: 'ivy',
      font: '',
      color: '#000',
      resume: {
        id: '',
        contact: {
          settings: [
            {
              key: 'showTitle',
              name: 'Show Title',
              value: true,
            },
            {
              key: 'showPhone',
              name: 'Show Phone',
              value: true,
            },
            {
              key: 'showLink',
              name: 'Show Link',
              value: true,
            },
            {
              key: 'showEmail',
              name: 'Show Email',
              value: true,
            },
            {
              key: 'showLocation',
              name: 'Show Location',
              value: true,
            },
          ],
          data: resumeData.contact.data,
        },
        sections: resumeData.sections,
      },
    });
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    // Generate a short ID for the file name
    const fileName = shortId();

    // Get the storage service
    const storage = this.cloud.getStorageService();

    // Start both the upload and text extraction concurrently
    const [url, content] = await Promise.all([
      storage.uploadFile(file, fileName), // Upload the file to storage
      this.extractText(file), // Extract text from the file
    ]);

    // Save the upload information in the database
    const upload = await this.uploadModel.create({
      userId,
      storageKey: url,
      shortId: fileName,
      rawContent: content,
    });

    // Return the ID of the upload
    return {
      upload_id: upload._id,
    };
  }

  private async extractText(file: Express.Multer.File) {
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    try {
      const response = await axios.post(
        this.config.get<string>('TIKA_ENDPOINT'),
        formData,
        {
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      const resumeData = response.data;

      return resumeData;
    } catch (error) {
      console.error('Error sending file to Flask API:', error);
      throw new Error('Failed to process the file');
    }
  }

  async suggestDomains(uploadId: string) {
    const uploaded = await this.uploadModel.findById(uploadId, {
      rawContent: 1,
    });

    const suggestions = await this.openai.suggestDomains(uploaded.rawContent);
    return suggestions;
  }

  async generateDomainSpecific(upload_id: string, domains: string[]) {
    const uploaded = await this.uploadModel.findById(upload_id, {
      rawContent: 1,
      userId: 1,
    });

    const promises = domains.map(async (domain) => {
      const resume = (await this.openai.resumeForDomain(
        uploaded.rawContent,
        domain,
      )) as ResumeType;

      const created = await this.createFromData(
        uploaded.userId,
        resume,
        `${domain} resume`,
      );
      return created;
    });

    await Promise.all(promises);
    return 'ok';
  }

  async generateDomainSpecificV2(upload_id: string, domains: string[]) {
    const uploaded = await this.uploadModel.findById(upload_id, {
      rawContent: 1,
      userId: 1,
    });

    const promises = domains.map(async (domain) => {
      const resume = (await this.openai.resumeForDomain(
        uploaded.rawContent,
        domain,
      )) as ResumeType;

      const created = await this.createFromData(
        uploaded.userId,
        resume,
        `${domain} resume`,
      );
      return created;
    });

    await Promise.all(promises);
    return 'ok';
  }

  async generateAnalyses(upload_id: string, isFree: boolean) {
    const uploaded = await this.uploadModel.findById(upload_id, {
      rawContent: 1,
      userId: 1,
    });

    const result = await this.openai.analyse(
      uploaded.rawContent,
      Boolean(isFree),
    );
    if (!Boolean(isFree)) await deductCredits(uploaded.userId, 50);
    return result;
  }

  async getPdf(upload_id: string) {
    const uploaded = await this.uploadModel.findById(upload_id, {
      shortId: 1,
    });

    const storage = this.cloud.getStorageService();

    const signedUrl = await storage.getSignedUrl(uploaded.shortId);

    return signedUrl;
  }
}
