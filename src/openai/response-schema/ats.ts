import { z } from 'zod';

export const AnalyzeSchema = z.object({
  raw: z
    .object({
      contact: z.object({
        fullName: z
          .string()
          .describe('Full name of candidate as per the resume'),
        phoneNumber: z
          .string()
          .describe('Phone number of candidate as per the resume'),
        email: z.string().describe('Email of candidate as per the resume'),
      }),
      experiences: z
        .array(
          z.object({
            title: z
              .string()
              .describe('The title of experience as per the resume'),
            company: z
              .string()
              .describe('The name of the company as per the resume'),
            startEnd: z
              .string()
              .describe(
                'The start and end of the experience as per the resume, Example: 2018-2020',
              ),
            details: z
              .array(z.string())
              .describe('Details of the experience as per the resume'),
            description: z.object({
              feedback: z
                .string()
                .describe(
                  'Your feedback on the provided details. Example: Your job description is 70% optimized.',
                ),
              recommendations: z
                .array(z.string())
                .describe('Your 3-5 recommendations to the candidate'),
              suggested: z
                .string()
                .describe(
                  'Your suggested/improved description, resolving all the issues and following all recommendations',
                ),
              skills: z
                .array(z.string())
                .describe(
                  'A list of skills that the candidate should add to this experience or to their profile based on this experience',
                ),
            }),
          }),
        )
        .describe('This contains the detailed analysis of each experience'),
      educations: z
        .array(
          z.object({
            institute: z
              .string()
              .describe(
                'The name of the institute from which the candidate got the education as per the resume',
              ),
            courseName: z
              .string()
              .describe(
                'The name of the course taken from that institute as per the resume',
              ),
            startEnd: z
              .string()
              .describe(
                'The start and end of the education as per the resume, Example: 2018-2020',
              ),
            details: z
              .array(z.string())
              .describe('Details of the education as per the resume'),
            description: z.object({
              feedback: z
                .string()
                .describe(
                  'Your feedback on the provided details. Example: Your education is 70% optimized.',
                ),
              recommendations: z
                .array(z.string())
                .describe('Your 3-5 recommendations to the candidate'),
              suggested: z
                .string()
                .describe(
                  'Your suggested/improved description, resolving all the issues and following all recommendations',
                ),
              skills: z
                .array(z.string())
                .describe(
                  'A list of skills that the candidate should add to this project or to their profile based on this education',
                ),
            }),
          }),
        )
        .describe(
          'Detailed analysis of all the educations on the candidates profile as per the resume',
        ),
      projects: z
        .array(
          z.object({
            projectTitle: z
              .string()
              .describe('The project title as per the resume'),
            details: z
              .array(z.string())
              .describe('Details of the project as per the resume'),
            description: z.object({
              feedback: z
                .string()
                .describe('Your 3-5 recommendations to the candidate'),
              recommendations: z.array(
                z
                  .string()
                  .describe(
                    'Your recommendation to the candidate for this project',
                  ),
              ),
              suggested: z
                .string()
                .describe(
                  'Your suggested description, resolving all the issues and following all recommendations',
                ),
              skills: z
                .array(z.string())
                .describe(
                  'A list of skills that the candidate should add to this project or to their profile based on this project',
                ),
            }),
          }),
        )
        .describe(
          'Detailed analysis of all the projects on the candidates profile as per the resume',
        ),
    })
    .describe(
      'The actual content present in the profile no assumptions no fixes... everything original',
    ),
  summary: z.object({
    atsScore: z
      .number()
      .describe(
        'The ATS Score for the resume, max allowed value for this is upto 50',
      ),
    impact: z
      .number()
      .describe(
        'The impact of the resume, max allowed value for this is upto 50',
      ),
    brevity: z
      .number()
      .describe(
        'The brevity of the resume, max allowed value for this is upto 50',
      ),
    relevance: z
      .number()
      .describe(
        'The relevance of the resume, max allowed value for this is upto 50',
      ),
    description: z.string().describe('Brief description'),
    professionalHeadline: z
      .object({
        suggestion: z.string().describe('Resume headline suggestion'),
        tip: z.string().describe('Resume headline tip'),
      })
      .describe("Resume's headline/summary"),
    proTip: z
      .string()
      .describe(
        'Pro tip for the resume. For example: "Regularly update your profile summary to reflect your most recent achievements"',
      ),
  }),
  // whatYouDidWell: z.array(
  //   z.object({
  //     area: z.string(),
  //     positiveFeedback: z.string(),
  //   }),
  // ),
  // professionalSummary: z.object({
  //   missingSkills: z.array(z.string()),
  //   rephrasedSentences: z.array(z.string()),
  // }),
  // workExperience: z.object({
  //   missingAchievements: z.array(z.string()),
  //   clarifiedResponsibilities: z.array(z.string()),
  //   additionalJobTitles: z.array(z.string()),
  // }),
  // skillsSection: z.object({
  //   additionalSkills: z.array(z.string()),
  //   categorizedSkills: z.array(z.string()),
  // }),
  // education: z.object({
  //   relevantCoursework: z.array(z.string()),
  //   improvedPresentation: z.string(),
  // }),
  // generalSuggestions: z.object({
  //   keywordMatchPercentage: z.number(),
  //   resumeLength: z.enum(['Ideal', 'Too Short', 'Too Long']),
  //   missingSections: z.array(z.string()),
  //   duplicateContent: z.boolean(),
  //   readabilityScore: z
  //     .number()
  //     .describe('max allowed value for this is upto 50'),
  //   sectionRecommendations: z.array(z.string()),
  //   tailoringAdvice: z.array(z.string()),
  // }),
});

export const AnalyzeSchemaFree = z.object({
  summary: z.object({
    atsScore: z
      .number()
      .describe(
        'The ATS Score for the resume, max allowed value for this is upto 50',
      ),
    impact: z
      .number()
      .describe(
        'The impact of the resume, max allowed value for this is upto 50',
      ),
    brevity: z
      .number()
      .describe(
        'The brevity of the resume, max allowed value for this is upto 50',
      ),
    relevance: z
      .number()
      .describe(
        'The relevance of the resume, max allowed value for this is upto 50',
      ),
    description: z.string().describe('Brief description'),
    professionalHeadline: z
      .object({
        suggestion: z.string().describe('Resume headline suggestion'),
        tip: z.string().describe('Resume headline tip'),
      })
      .describe("Resume's headline/summary"),
    proTip: z
      .string()
      .describe(
        'Pro tip for the resume. For example: "Regularly update your profile summary to reflect your most recent achievements"',
      ),
  }),
});
