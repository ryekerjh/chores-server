import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Child } from 'src/child/entities/child.entity';

export type AlertDocument = HydratedDocument<Alert>;

@Schema()
export class Alert {
    
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, minlength: 1 })
  icons: string[];
}

export const AlertSchema = SchemaFactory.createForClass(Alert);