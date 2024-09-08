import { z } from 'zod';

export const LinkedinSchema = z.object({
  raw: z
    .object({
      fullName: z.string(),
      location: z.string(),
      experiences: z.array(
        z.object({
          title: z.string(),
          company_name: z.string(),
          startEnd: z.string().describe('eg: Jun 2024 - Present'),
        }),
      ),
      education: z.array(
        z.object({
          institute: z.string(),
          degree: z.string(),
          startEnd: z.string().describe('eg: Jun 2024 - Present'),
        }),
      ),
    })
    .describe(
      'The actual content present in the profile no assumptions no fixes... everything original',
    ),
  percentageScore: z
    .number()
    .describe('An overall profile strength score (0-100%)'),
  scoreExplanation: z
    .string()
    .describe('a brief explanation of the percentageScore'),
  fullName: z
    .string()
    .describe(
      'Check if Full Name is provided or not, if not then provide a suggestion, else applaud them. DO NOT PUT THE NAME IN HERE',
    ),
  location: z
    .string()
    .describe(
      'Check if the candidate has provided their location in the profile or not, else give your suggestion, else applaud them.  DO NOT PUT THE LOCATION IN HERE',
    ),
  industry: z
    .string()
    .describe(
      "Suggest a industry/job title based on your deep understanding of the person's domain and current job market trends",
    ),
  headline: z.object({
    length: z
      .string()
      .describe(
        'Check if the headline is of appropriate length, else give suggestion',
      ),
    recommendations: z
      .string()
      .describe('Your recommendations for the candidates'),
    suggested: z
      .string()
      .describe(
        "The headline that you would like to suggest to the candidate based on your deep understanding of the person's domain and current job market trends. This should follow linkedin guides and should be of appropriate length, it should be SEO friendly as well",
      ),
  }),
  topSkills: z
    .array(z.string())
    .describe('Top skills mentioned on candidates profile'),
  keySkills: z
    .array(z.string())
    .describe(
      "Recommend skills that the candidate should add to their profile based on based on your deep understanding of the person's domain",
    ),
  commonSkills: z
    .array(z.string())
    .describe(
      'Recommend skills that the candidate should add to their profile based on based on job market trends',
    ),
  summary: z.object({
    problem: z
      .string()
      .describe('the problems with the current summary of candidate'),
    recommendations: z
      .string()
      .describe('your recommendations to the candidate'),
    suggested: z
      .string()
      .describe(
        'Your suggested summary, resolving all the issues and following all recommendations',
      ),
  }),
  experiences: z
    .array(
      z.object({
        title: z.string().describe('The title of experience'),
        company: z.string().describe('the name of the company'),
        startEnd: z
          .string()
          .describe('the start and end of the experience eg: 2018-2020'),
        feedback: z
          .string()
          .describe(
            'Your feedback on the provided description. eg: Your job description is 70% optimized.',
          ),
        description: z.object({
          recommendations: z
            .array(z.string())
            .describe('your 3-5 recommendations to the candidate'),
          suggested: z
            .string()
            .describe(
              'Your suggested/improved description, resolving all the issues and following all recommendations',
            ),
        }),
        skills: z
          .array(z.string())
          .describe(
            'A list of skills that the candidate should add to this experience or to their profile based on this experience',
          ),
      }),
    )
    .describe('This contains the detailed analysis of each experience'),
  educations: z
    .array(
      z.object({
        activities: z.object({
          suggested: z
            .string()
            .describe(
              'Your suggested activities based on the course/institute, resolving all the issues and following all recommendations',
            ),
        }),
        description: z.object({
          problem: z
            .string()
            .describe(
              'the problems with the current description of the education',
            ),
          recommendations: z
            .string()
            .describe('your recommendations to the candidate'),
          suggested: z
            .string()
            .describe(
              'Your suggested description, resolving all the issues and following all recommendations',
            ),
        }),
        skills: z
          .array(z.string())
          .describe(
            'A list of skills that the candidate should add to this education or to their profile based on this education',
          ),
      }),
    )
    .describe(
      'Detailed analysis of all the educations on the candidates profile',
    ),
  certifications: z
    .array(
      z.object({
        skills: z
          .array(z.string())
          .describe(
            'A list of skills that the candidate should add to this certification or to their profile based on this certification. This will be individual for each certification',
          ),
      }),
    )
    .describe(
      'Detailed analysis of all the certifications on the candidates profile',
    ),
  projects: z
    .array(
      z.object({
        description: z.object({
          problem: z
            .string()
            .describe(
              'the problems with the current description of the project',
            ),
          recommendations: z
            .string()
            .describe('your recommendations to the candidate'),
          suggested: z
            .string()
            .describe(
              'Your suggested description, resolving all the issues and following all recommendations',
            ),
        }),
        skills: z
          .array(z.string())
          .describe(
            'A list of skills that the candidate should add to this project or to their profile based on this project',
          ),
      }),
    )
    .describe(
      'Detailed analysis of all the projects on the candidates profile',
    ),
  tipsTricks: z
    .array(z.string())
    .describe(
      'A prioritized list of the top 3-5 actions the profile owner should take immediately for maximum impact.',
    ),
});
