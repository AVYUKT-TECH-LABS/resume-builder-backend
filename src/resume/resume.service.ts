import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import natural from 'natural';
import { english as stopwords } from 'stopwords';
import { CloudService } from '../cloud/cloud.service';
import { OpenAiService } from '../openai/openai.service';
import { Resume } from '../schemas/resume.schema';
import { Upload } from '../schemas/upload.schema';
import { Resume as ResumeType } from '../types/index';
import shortId from '../utils/shortid';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResumeServiceV2 } from './resumev2.service';

@Injectable()
export class ResumeService {
    constructor(
        @InjectModel(Resume.name) private resumeModel: Model<Resume>,
        @InjectModel(Upload.name) private uploadModel: Model<Upload>,
        private cloud: CloudService,
        private openai: OpenAiService,
        private config: ConfigService,
        private resumeServiceV2: ResumeServiceV2,
    ) { }

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
            // await deductCredits(userId, 30);

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
        // await deductCredits(userId, 30);

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

    private extractKeywords(text) {
        // Tokenize the text
        const tokenizer = new natural.WordTokenizer();
        let tokens = tokenizer.tokenize(text.toLowerCase());

        // Remove stopwords
        tokens = tokens.filter((token) => !stopwords.includes(token));

        // Remove non-alphabetic tokens and short tokens
        tokens = tokens.filter(
            (token) => /^[a-z]+$/.test(token) && token.length > 2,
        );

        // Count frequency of each token
        const frequency = {};
        tokens.forEach((token) => {
            frequency[token] = (frequency[token] || 0) + 1;
        });

        // Sort tokens by frequency
        const sortedTokens = Object.entries(frequency)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .map((entry) => entry[0]);

        // Return top 20 keywords
        return sortedTokens.slice(0, 20);
    }

    public async extractText(file: Express.Multer.File) {
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
            processedContent: 1,
        });

        if (uploaded.processedContent) return JSON.parse(uploaded.processedContent);

        const suggestions = await this.openai.suggestDomains(uploaded.rawContent);
        await uploaded.updateOne({
            processedContent: JSON.stringify(suggestions),
        });
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

    async generateAnalyses(
        upload_id: string,
        isFree: boolean,
        jd: string,
        resumeId?: string,
    ) {
        const uploaded = await this.uploadModel.findById(upload_id, {
            rawContent: 1,
            userId: 1,
            processedContent: 1,
        });

        if (!resumeId && uploaded.processedContent)
            return JSON.parse(uploaded.processedContent);

        if (uploaded.userId != "GUEST_USER") {
            if (Boolean(isFree)) return;
            const hasEnoughCredits = await this.resumeServiceV2.hasCredits(
                uploaded.userId,
                50,
            );
            if (!hasEnoughCredits) throw new ForbiddenException('Not enough credits');
        }

        if (!resumeId) {
            const newResume =
                await this.resumeServiceV2.generateFromExisting(upload_id);
            resumeId = newResume._id.toString();
        }

        const result = await this.openai.analyse(
            uploaded.rawContent,
            Boolean(isFree),
            jd,
        );
        if (uploaded.userId != "GUEST_USER")
            if (!Boolean(isFree))
                await this.resumeServiceV2.deductCredits(uploaded.userId, 50);

        await uploaded.updateOne({
            processedContent: JSON.stringify(result),
        });
        return { ...result, resumeId };
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
