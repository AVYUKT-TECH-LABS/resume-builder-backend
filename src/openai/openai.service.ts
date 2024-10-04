import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z, ZodType, ZodTypeDef } from 'zod';
import prompts from '../prompts';
import { DomainSuggestions, ParsedResume } from './response-schema';
import { AnalyzeSchema, AnalyzeSchemaFree } from './response-schema/ats';
import { LinkedinSchema } from './response-schema/linkedin-optimizer';
import { ParsedResumeV2 } from './response-schema/v2';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;
  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(
    prompt: string,
    input: string,
    formatter: {
      schema: ZodType<any, ZodTypeDef, any>;
      name: string;
    },
  ) {
    try {
      // const { object } = await generateObject({
      //   model: openai(this.config.get<string>('AI_MODEL')),
      //   schema: formatter.schema,
      //   messages: [
      //     {
      //       role: 'system',
      //       content: prompt,
      //     },
      //     {
      //       role: 'user',
      //       content: input,
      //     },
      //   ],
      //   maxTokens:
      //     Number(this.config.get<number>('OPEN_AI_MAX_TOKENS')) || 2000,
      //   temperature:
      //     Number(this.config.get<number>('OPEN_AI_TEMPERATURE')) || 0.5,
      // });
      // return object;

      const response = await this.openai.beta.chat.completions.parse({
        model: this.config.get('AI_MODEL') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: input,
          },
        ],
        max_tokens:
          Number(this.config.get<number>('OPEN_AI_MAX_TOKENS')) || 2000,
        temperature:
          Number(this.config.get<number>('OPEN_AI_TEMPERATURE')) || 0.9,
        response_format: zodResponseFormat(formatter.schema, formatter.name),
      });

      return response.choices[0].message.parsed;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  async generateEmbeddings(input: string) {
    try {
      const response = await this.openai.embeddings.create({
        input,
        model: 'text-embedding-3-small',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to generate embeddings from OpenAI');
    }
  }

  async parse(content: string) {
    const output = await this.generateResponse(prompts.parse, content, {
      schema: ParsedResume,
      name: 'parse-resume',
    });

    return output;
  }

  async suggestDomains(content: string) {
    const output = await this.generateResponse(
      prompts.domainSuggestion,
      content,
      {
        schema: DomainSuggestions,
        name: 'domain-suggestions',
      },
    );

    return output;
  }

  async resumeForDomain(
    content: string,
    domain: string,
    v: 'v1' | 'v2' = 'v1',
  ) {
    const formatter =
      v == 'v1'
        ? {
            name: 'resume-variation',
            schema: ParsedResume,
          }
        : {
            name: 'resume-variation',
            schema: ParsedResumeV2,
          };

    const output = await this.generateResponse(
      prompts.variation,
      `
        content: ${content}
        
        required domain: ${domain}
      `,
      formatter,
    );

    return output;
  }
  async resumeFromExisting(content: string) {
    const formatter = {
      name: 'resume-variation',
      schema: ParsedResumeV2,
    };

    const output = await this.generateResponse(
      'convert the below content of the resume in the requested format. DO NOT ASSUME ANYTHING. JUST USE THE PROVIDED DATA AND NOTHING ELSE',
      `
        content: ${content}
      `,
      formatter,
    );

    return output;
  }

  async analyse(content: string, isFree = false, jd: string) {
    if (isFree) {
      const output = await this.generateResponse(
        prompts.analyzeFree,
        `
          content: ${content}

          jd: ${jd}
        `,
        {
          name: 'resume-analyze',
          schema: AnalyzeSchemaFree,
        },
      );

      return output;
    }

    const output = await this.generateResponse(
      prompts.analyze,
      `
          content: ${content}

          jd: ${jd}
        `,
      {
        name: 'resume-analyze',
        schema: AnalyzeSchema,
      },
    );

    return output;
  }

  async optimizeLinkedIn(content: string) {
    return this.generateResponse(prompts.optimizeLinkedIn, content, {
      name: 'linkedin-optimizer',
      schema: LinkedinSchema,
    });
  }

  async improve(content: string) {
    return this.generateResponse(
      'Please improve the given content for a resume, if you think the given content is not something from a resume then dont do anything...only return the improved text and nothing else. The text should follow the General ATS Guidelines. Modify the content upto 75% but still keeping the original information intact. DO NOT ASSUME ANYTHING and only use the content provided. The new content must be completely differ from the previous one but it should also maintain the context and important information. Be as creative as you can. Give your best work',
      content,
      {
        name: 'talent-ai',
        schema: z.object({
          content: z.string().describe('The improved content'),
        }),
      },
    );
  }
}
