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
  suggestions: z.array(z.string()),
});

const AnalyzeSchema = z.object({
  atsScore: z.object({
    score: z.number().describe('max allowed value for this is upto 50'),
    impact: z.number().describe('max allowed value for this is upto 50'),
    brevity: z.number().describe('max allowed value for this is upto 50'),
    relevance: z.number().describe('max allowed value for this is upto 50'),
    description: z.string(),
  }),
  whatYouDidWell: z.array(
    z.object({
      area: z.string(),
      positiveFeedback: z.string(),
    }),
  ),
  professionalSummary: z.object({
    missingSkills: z.array(z.string()),
    rephrasedSentences: z.array(z.string()),
  }),
  workExperience: z.object({
    missingAchievements: z.array(z.string()),
    clarifiedResponsibilities: z.array(z.string()),
    additionalJobTitles: z.array(z.string()),
  }),
  skillsSection: z.object({
    additionalSkills: z.array(z.string()),
    categorizedSkills: z.array(z.string()),
  }),
  education: z.object({
    relevantCoursework: z.array(z.string()),
    improvedPresentation: z.string(),
  }),
  generalSuggestions: z.object({
    keywordMatchPercentage: z.number(),
    resumeLength: z.enum(['Ideal', 'Too Short', 'Too Long']),
    missingSections: z.array(z.string()),
    duplicateContent: z.boolean(),
    readabilityScore: z
      .number()
      .describe('max allowed value for this is upto 50'),
    sectionRecommendations: z.array(z.string()),
    tailoringAdvice: z.array(z.string()),
  }),
});

const AnalyzeSchemaFree = z.object({
  atsScore: z.object({
    score: z.number(),
  }),
});

export { AnalyzeSchema, AnalyzeSchemaFree, DomainSuggestions, ParsedResume };
