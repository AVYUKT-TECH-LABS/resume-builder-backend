import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResumeDocument = HydratedDocument<Resume>;

@Schema({ timestamps: true })
export class Resume {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, required: true })
  page: {
    size: string;
    background: string | null;
    margins: number;
    spacing: number;
  };

  @Prop({ required: true })
  template: string;

  @Prop()
  font: string;

  @Prop()
  color: string;

  @Prop({ type: Object, required: true })
  resume: {
    id: string;
    contact: {
      settings: {
        name: string;
        value: boolean;
        key: string;
      }[];
      data: {
        name: string;
        title: string;
        phone: string;
        link: string;
        email: string;
        location: string;
      };
    };
    sections: {
      containerId: string | null;
      containerPosition: number;
      title: string;
      type: string;
      list: any[];
    }[];
  };

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);
