import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type Document = HydratedDocument<JobEmbeddings>;

@Schema({ timestamps: true })
export class JobEmbeddings {
  @Prop({ required: true, unique: true })
  jobId: string;

  @Prop({ required: true })
  embeddings: number[];
}

export const JobEmbeddingsSchema = SchemaFactory.createForClass(JobEmbeddings);
