import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResumeDocumentV2 = HydratedDocument<ResumeV2>;

export interface Picture {
  enabled: boolean;
  url: string;
  size: number;
  radius: number;
  border: boolean;
  grayscale: boolean;
}

export interface PersonalInformation {
  name: string;
  title: string;
  phone: string;
  email: string;
}

export interface EmploymentHistory {
  title: string;
  companyName: string;
  startDate: Date;
  endDate: Date | null;
  location: string;
  summary: string;
}

export interface Education {
  institute: string;
  degree: string;
  score: string;
  startDate: Date;
  endDate: Date | null;
  location: string;
  summary: string;
}

export interface Project {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  link: string;
  summary: string;
}

export interface Sections {
  personalInformation: PersonalInformation;
  summary: string;
  employmentHistory: EmploymentHistory[];
  education: Education[];
  projects: Project[];
  skills: string[];
  [key: string]: any;
}

@Schema({ timestamps: true })
export class ResumeV2 {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Object, required: true })
  pageConfig: {
    size: 'A4' | 'letter';
    background: string | null;
    margin: number;
    spacing: number;
    font: {
      fontFamily: string;
      fontWeight?: string;
      fontStyle?: string;
    };
    fontSizes: {
      heading: number;
      subHeading: number;
      content: number;
      lineHeight: number;
    };
    colors: {
      primary: string;
      background: string;
      text: string;
    };
    template: string;
  };

  @Prop({ type: Object, required: true })
  sections: Sections;

  @Prop({ type: Object, required: true })
  picture: Picture;
}

export const ResumeSchemaV2 = SchemaFactory.createForClass(ResumeV2);
