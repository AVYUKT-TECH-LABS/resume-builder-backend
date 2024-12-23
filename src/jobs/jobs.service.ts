import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Browser, Page } from 'puppeteer';
import _puppeteer from '../puppeteer';
import { ConfigService } from '@nestjs/config';

interface Job {
    title: string;
    company: string;
    location: string;
    link: string;
    platform: string;
    id: string;
}

@Injectable()
export class JobsService {
    private readonly logger: Logger = new Logger(JobsService.name);
    private browser: Browser | null = null;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 5000; // 5 seconds

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    private async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await _puppeteer();
        }
        return this.browser;
    }

    private async setupPage(): Promise<Page> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        await Promise.all([
            page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 }),
            page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
            ),
            this.applyStealth(page),
            page.emulateMediaFeatures([
                { name: 'prefers-color-scheme', value: 'light' },
                { name: 'prefers-reduced-motion', value: 'no-preference' },
            ]),
        ]);

        return page;
    }

    private async applyStealth(page: Page): Promise<void> {
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            (window as any).chrome = { runtime: {} };
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters: any) =>
                parameters.name === 'notifications'
                    ? Promise.resolve({ state: 'denied' } as PermissionStatus)
                    : originalQuery(parameters);
        });
    }

    private static generateHash(input: string, algorithm = 'sha256'): string {
        return crypto.createHash(algorithm).update(input).digest('hex');
    }

    private async autoScroll(page: Page): Promise<void> {
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    }

    @Cron('0 2 * * *')
    async scrapeIndeedJobs(): Promise<void> {
        this.logger.log('Starting Indeed scraper');
        const numPages = this.config.get<number>('PAGES_TO_SCRAPE') || 20;
        let page: Page | null = null;
        try {
            page = await this.setupPage();
            const jobs: Job[] = [];

            for (let i = 0; i < numPages; i++) {
                const url = `https://in.indeed.com/jobs?q=&l=India&start=${i * 10}`;
                await this.retryOperation(() =>
                    this.scrapePage(page!, url, this.extractIndeedJobData, jobs),
                );
            }

            await this.saveBulk(jobs);
        } catch (error) {
            this.logger.error('Failed to scrape Indeed jobs', error);
        } finally {
            if (page) await page.close();
        }
    }

    @Cron('0 2 * * *')
    async scrapeNaukriJobs(): Promise<void> {
        this.logger.log('Starting Naukri scraper');
        const numPages = this.config.get<number>('PAGES_TO_SCRAPE') || 20;
        let page: Page | null = null;
        try {
            page = await this.setupPage();
            const jobs: Job[] = [];

            for (let i = 0; i < numPages; i++) {
                const url = `https://www.naukri.com/jobs-in-india-${i}`;
                await this.retryOperation(() =>
                    this.scrapePage(page!, url, this.extractNaukriJobData, jobs),
                );
            }

            await this.saveBulk(jobs);
        } catch (error) {
            this.logger.error('Failed to scrape Naukri jobs', error);
        } finally {
            if (page) await page.close();
        }
    }

    private async scrapePage(
        page: Page,
        url: string,
        extractJob: (card: any) => Promise<Job>,
        jobs: Job[],
    ): Promise<void> {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await this.autoScroll(page);

        const jobCards = await page.$$('.job_seen_beacon, .cust-job-tuple');

        for (const card of jobCards) {
            try {
                const job = await extractJob(card);
                jobs.push(job);
            } catch (error) {
                this.logger.warn(`Error extracting job data: ${error.message}`);
            }
        }
    }

    private async extractIndeedJobData(card: any): Promise<Job> {
        const title = await card.$eval(
            '.jobTitle',
            (el: any) => el.textContent?.trim() || '',
        );
        const company = await card.$eval(
            '[data-testid="company-name"]',
            (el: any) => el.textContent?.trim() || '',
        );
        const location = await card.$eval(
            '[data-testid="text-location"]',
            (el: any) => el.textContent?.trim() || '',
        );
        const link = await card.$eval(
            'h2.jobTitle a.jcs-JobTitle',
            (el: any) => el.getAttribute('href') || '',
        );

        const job = {
            title,
            company,
            location,
            link: `https://www.indeed.com${link}`,
            platform: 'indeed',
            id: '',
        };

        job.id = JobsService.generateHash(JSON.stringify(job));
        return job;
    }

    private async extractNaukriJobData(card: any): Promise<Job> {
        const title = await card.$eval(
            '.title',
            (el: any) => el.textContent?.trim() || '',
        );
        const company = await card.$eval(
            '.comp-name',
            (el: any) => el.textContent?.trim() || '',
        );
        const location = await card.$eval(
            'span.locWdth',
            (el: any) => el.textContent?.trim() || '',
        );
        const link = await card.$eval(
            'a.title',
            (el: any) => el.getAttribute('href') || '',
        );

        const job = {
            title,
            company,
            location,
            link,
            platform: 'naukri',
            id: '',
        };

        job.id = JobsService.generateHash(JSON.stringify(job));
        return job;
    }

    private async retryOperation<T>(
        operation: () => Promise<T>,
        retries = this.MAX_RETRIES,
    ): Promise<T> {
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === retries - 1) throw error;
                this.logger.warn(
                    `Operation failed, retrying (${i + 1}/${retries}): ${error.message}`,
                );
                await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
            }
        }
        throw new Error('Max retries reached');
    }

    private async saveBulk(jobs: Job[]): Promise<void> {
        try {
            this.logger.log(`Saving ${jobs.length} aggregated jobs`);
            await this.retryOperation(async () => {
                await this.prisma.aggregatedJob.createMany({
                    data: jobs,
                    skipDuplicates: true,
                });
            });
        } catch (error) {
            this.logger.error('Failed to save bulk jobs', error);
        }
    }

    async get({ page, limit }: { page: number, limit: number }) {
        try {
            const totalItems = await this.prisma.aggregatedJob.count({});

            // Calculate pagination values
            const skip = (page - 1) * limit;
            const totalPages = Math.ceil(totalItems / limit);

            const jobs = await this.prisma.aggregatedJob.findMany({
                skip: skip,
                take: limit,
            });

            return {
                data: jobs,
                meta: {
                    totalItems,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                }
            };
        } catch (err) {
            this.logger.log(err);
            throw err;
        }
    }
}
