import { z } from 'zod';

const Contact = z.object({
  data: z.object({
    name: z.string(),
    title: z.string(),
    phone: z.string(),
    link: z.string(),
    email: z.string(),
    location: z.string(),
  }),
});

const ExperienceItem = z.object({
  companyName: z.string(),
  title: z.string(),
  bullets: z.array(z.string()),
  location: z.string(),
  period: z.string(),
});

const EducationItem = z.object({
  instituteName: z.string(),
  degree: z.string(),
  bullets: z.array(z.string()),
  location: z.string(),
  period: z.string(),
});

const SummaryItem = z.object({
  summary: z.string(),
});

const Skills = z.object({
  skillheading: z.string(),
  data: z.array(z.string()),
});

const AchievementsItem = z.object({
  achievement: z.string(),
  details: z.string(),
});

const ProjectItem = z.object({
  projectName: z.string(),
  period: z.string(),
  bullets: z.array(z.string()),
});

const Section = z.object({
  containerId: z.string().nullable(),
  containerPosition: z.number().int(),
  title: z.string(),
  type: z.enum([
    'education',
    'experience',
    'summary',
    'skills',
    'achievements',
    'projects',
  ]),
  list: z.array(
    z.object({
      data: z.union([
        ExperienceItem,
        EducationItem,
        SummaryItem,
        Skills,
        AchievementsItem,
        ProjectItem,
      ]),
    }),
  ),
});

const ParsedResume = z.object({
  id: z.string(),
  contact: Contact,
  sections: z.array(Section),
});

const DomainSuggestions = z.object({
  domain: z.string(),
  suggestions: z.array(
    z.object({
      title: z.string().describe('The suggested domain'),
      category: z
        .string()
        .describe(
          'The category of the suggested domains from VARIATED_CATEGORIES',
        ),
    }),
  ),
});

export { DomainSuggestions, ParsedResume };
