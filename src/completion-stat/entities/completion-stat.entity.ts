import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type CompletionStatDocument = HydratedDocument<CompletionStat>;

@Schema({ timestamps: true, collection: 'completion_stats' })
export class CompletionStat {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
  })
  childId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  parentId: mongoose.Types.ObjectId;

  /** Local calendar date as YYYY-MM-DD */
  @Prop({ required: true })
  date: string;

  @Prop({
    type: String,
    required: true,
    enum: ['am', 'pm'],
  })
  dayPart: string;

  @Prop({ required: true, min: 0, default: 0 })
  completed: number;

  @Prop({ required: true, min: 0, default: 0 })
  total: number;

  /** completed / total, 0 when total is 0 */
  @Prop({ required: true, min: 0, max: 1, default: 0 })
  rate: number;
}

export const CompletionStatSchema = SchemaFactory.createForClass(CompletionStat);

CompletionStatSchema.index(
  { childId: 1, date: 1, dayPart: 1 },
  { unique: true },
);
CompletionStatSchema.index({ parentId: 1, date: -1 });
CompletionStatSchema.index({ childId: 1, date: -1 });
CompletionStatSchema.index({ parentId: 1, childId: 1, date: -1 });
