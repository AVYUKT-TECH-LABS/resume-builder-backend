import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResumeDocument = HydratedDocument<Upload>;

@Schema({ timestamps: true })
export class Upload {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  storageKey: string;

  @Prop({ required: true })
  shortId: string;

  @Prop()
  rawContent: string;

  @Prop()
  processedContent: string;
}

export const UploadSchema = SchemaFactory.createForClass(Upload);
