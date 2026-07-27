import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AlertDocument = HydratedDocument<Alert>;

@Schema()
export class Alert {
    
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, minlength: 1 })
  icons: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);