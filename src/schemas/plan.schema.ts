import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type Document = HydratedDocument<Plan>;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  display_amount: number;

  @Prop({ required: true })
  billingFrequency: string; // 'monthly', 'yearly', etc.

  @Prop({ type: Map, of: Number })
  featureLimits: Map<string, number>;

  @Prop()
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

/*
{
  name: "Premium",
  price: 29.99,
  billingFrequency: "monthly",
  featureLimits: {
    "apples": 100,
    "oranges": 200,
    "bananas": 50,
    "customReports": 10,
    "apiCalls": 10000,
    "storageGB": 50
  },
  description: "Our most popular plan for growing businesses. Includes advanced features and higher usage limits.",
  isActive: true,
  createdAt: ISODate("2024-08-21T10:00:00Z"),
  updatedAt: ISODate("2024-08-21T10:00:00Z")
}
*/
