import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Child } from 'src/child/entities/child.entity';

export type ChoreDocument = HydratedDocument<Chore>;

@Schema()
export class Chore {

  @Prop()
  name: string;

  @Prop({
    type: String,
    required: true,
    enum: ['am', 'pm'],
  })
  dayPart: string;

  @Prop()
  icon: string;

  @Prop({
    type: Array,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  })
  days: string[];
}

export const ChoreSchema = SchemaFactory.createForClass(Chore);