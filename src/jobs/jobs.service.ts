import { Injectable } from '@nestjs/common';
import _puppeteer from '../puppeteer';

interface Job {
  title: string;
  company: string;
  location: string;
  link: string;
  platform: string;
}

@Injectable()
export class JobsService {
  setupPage = async (browser: any) => {
    const page = await browser.newPage();

    // Set viewport and User-Agent concurrently
    await Promise.all([
      page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 }),
      page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
      ),
    ]);

    // Apply stealth techniques and media features concurrently
    await Promise.all([
      page.evaluateOnNewDocument(() => {
        // Hide the `navigator.webdriver` property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });

        // Fake navigator.plugins to avoid plugin detection
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3], // Fake some plugins
        });

        // Fake navigator.languages to avoid language detection
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'], // Set languages
        });

        // Mock other potential detection methods
        (window as any).chrome = { runtime: {} }; // Mock Chrome runtime

        // Overwrite the 'permission' API to prevent headless detection
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => {
          return parameters.name === 'notifications'
            ? Promise.resolve({ state: 'denied' } as PermissionStatus)
            : originalQuery(parameters);
        };
      }),
      page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'light' },
        { name: 'prefers-reduced-motion', value: 'no-preference' },
      ]),
    ]);

    // // Set request interception and handle requests
    // await page.setRequestInterception(true);
    // page.on("request", (request: any) => {
    //   if (
    //     ["image", "stylesheet", "font", "script"].includes(request.resourceType())
    //   ) {
    //     request.abort(); // Block image, stylesheet, font, and script requests
    //   } else {
    //     request.continue();
    //   }
    // });

    return page;
  };

  async autoScroll(page: any) {
    return new Promise((resolve) => {
      resolve(page);
    });
    // await page.evaluate(async () => {
    //   await new Promise((resolve) => {
    //     var totalHeight = 0;
    //     var distance = 100;
    //     var timer = setInterval(() => {
    //       var scrollHeight = document.body.scrollHeight;
    //       window.scrollBy(0, distance);
    //       totalHeight += distance;

    //       if (totalHeight >= scrollHeight - window.innerHeight) {
    //         clearInterval(timer);
    //         resolve('done');
    //       }
    //     }, 100);
    //   });
    // });
  }

  async scrapeIndeedJobs(numPages: number = 1): Promise<Job[]> {
    const browser = await _puppeteer();
    const page = await this.setupPage(browser);
    const jobs: Job[] = [];

    for (let i = 0; i < numPages; i++) {
      const url = `https://in.indeed.com/jobs?q=&l=India&start=${i * 10}`;
      await page.goto(url, { waitUntil: 'networkidle0' });

      const [, jobCards] = await Promise.all([
        this.autoScroll(page),
        page.$$('.job_seen_beacon'),
      ]);

      for (const card of jobCards) {
        try {
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

          jobs.push({
            title,
            company,
            location,
            link: `https://www.indeed.com${link}`,
            platform: 'indeed',
          });
        } catch (error) {
          console.error('Error scraping Indeed job card:', error);
        }
      }
    }
    return jobs;
  }

  async scrapeNaukriJobs(numPages: number = 1): Promise<Job[]> {
    const browser = await _puppeteer();
    const page = await this.setupPage(browser);

    const jobs: Job[] = [];

    for (let i = 0; i < numPages; i++) {
      const url = `https://www.naukri.com/jobs-in-india-${i}`;
      await page.goto(url, { waitUntil: 'networkidle0' });

      const [, jobCards] = await Promise.all([
        this.autoScroll(page),
        page.$$('.cust-job-tuple'),
      ]);

      for (const card of jobCards) {
        try {
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

          jobs.push({
            title,
            company,
            location,
            link,
            platform: 'naukri',
          });
        } catch (error) {
          console.error('Error scraping Naukri job card:', error);
        }
      }
    }

    return jobs;
  }
}
