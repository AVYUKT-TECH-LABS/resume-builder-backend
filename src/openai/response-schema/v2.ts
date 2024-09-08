import { z } from 'zod';

const personalInformation = z.object({
  name: z.string().describe('The name of the person on resume'),
  title: z.string().describe('The job title/role eg: Fullstack Developer'),
  phone: z
    .number()
    .describe('The phone number/contact number of the person on resume'),
  email: z.string().describe('The email address of the person on resume'),
});

const employmentHistory = z.array(
  z.object({
    title: z
      .string()
      .describe('The title of employment. eg: Cloud solutions engineer'),
    company_name: z
      .string()
      .describe('The name of the employment providing company'),
    start: z
      .string()
      .describe('The starting month & year of this employment. eg: Aug 2'),
    end: z
      .string()
      .describe('The ending month & year of this employment. eg: Sep 24'),
    location: z.string().describe('The location of this employment'),
    summary: z
      .string()
      .describe(
        'The summary/details of this employment. Bulletize and quantify this and return in rich text format. Maximum of 4 bullets are allowed',
      ),
  }),
);

const education = z.array(
  z.object({
    institute: z
      .string()
      .describe('The name of institute on the resume. eg: IIT Delhi'),
    degree: z.string().describe('The name of the degree from this education'),
    score: z.string().describe('The score obtained in this education'),
    start: z
      .string()
      .describe('The starting month & year of this education. eg: Aug 2'),
    end: z
      .string()
      .describe('The ending month & year of this education. eg: Sep 24'),
    location: z.string().describe('The location of this education/institute'),
    summary: z
      .string()
      .describe(
        'The summary/details of this education. Bulletize and quantify this and return in rich text format. Maximum of 4 bullets are allowed',
      ),
  }),
);

const projects = z.array(
  z.object({
    name: z
      .string()
      .describe(
        'The name of the project on the resume. eg: Advanced Recommendation system',
      ),
    description: z.string().describe('A short description of this project'),
    start: z
      .string()
      .describe(
        'The starting month & year of this education. eg: Aug 2(if available, else leave blank)',
      ),
    end: z
      .string()
      .describe(
        'The ending month & year of this education. eg: Sep 24(if available, else write present or leave blank if the start was also not present)',
      ),
    link: z
      .string()
      .describe('The link to this project(if available, else leave blank)'),
    summary: z
      .string()
      .describe(
        'The summary/details of this project. Bulletize and quantify this and return in rich text format. Maximum of 4 bullets are allowed',
      ),
  }),
);

const sections = z.object({
  personalInformation,
  summary: z
    .string()
    .describe('The summary written on resume/ generated resume'),
  employmentHistory,
  education,
  projects,
  skills: z
    .array(z.string().describe('The name of individual skill'))
    .describe(
      'The list of skills mentioned/found on resume in a string format',
    ),
  //TODO: add support for custom sections
});

export const ParsedResumeV2 = z.object({
  sections,
});
