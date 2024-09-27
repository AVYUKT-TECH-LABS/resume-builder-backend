import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('')
  async getJobs(@Query('q') q: string) {
    const searchTerm = q;
    if (!searchTerm) {
      throw new BadRequestException({ error: 'Missing search term' });
    }
    try {
      // Fetch jobs from multiple platforms in parallel with error handling using Promise.allSettled
      const [indeedResult, naukriResult] = await Promise.allSettled([
        this.jobsService.scrapeIndeedJobs(),
        this.jobsService.scrapeNaukriJobs(),
      ]);

      // Process the results and only include successful scrapes
      const jobs = [
        ...(indeedResult.status === 'fulfilled' ? indeedResult.value : []),
        ...(naukriResult.status === 'fulfilled' ? naukriResult.value : []),
      ];

      if (jobs.length === 0) {
        throw new NotFoundException(
          '<h1>No jobs found for the search term.</h1>',
        );
      }

      // Send styled HTML table with the jobs that were successfully scraped
      return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            table, th, td { border: 1px solid black; }
            th, td { padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            a { color: #0366d6; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Job Listings</h1>
          <table>
            <thead>
              <tr>
                <th>IDX</th>
                <th>Platform</th>
                <th>Title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              ${jobs
                .map(
                  (job, idx) => `
                <tr>
                  <td>${idx}</td>
                  <td>${job.platform}</td>
                  <td>${job.title}</td>
                  <td>${job.company}</td>
                  <td>${job.location}</td>
                  <td><a href="${job.link}" target="_blank">View Job</a></td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new InternalServerErrorException({
        error: 'An error occurred while fetching jobs',
      });
    }
  }
}
