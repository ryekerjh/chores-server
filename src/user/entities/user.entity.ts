import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { Alert } from 'src/alert/entities/alert.entity';

export type UserDocument = HydratedDocument<User>;
import { Child } from '../../child/entities/child.entity';

@Schema()
export class User {
  @Prop({ type: [ mongoose.Schema.Types.ObjectId], ref: Child.name, autopopulate: true })
  children: Child[];

  @Prop({ required: true, unique: true })
  email: String;

  @Prop({ 
    required: true,
    enum: ['admin', 'public', 'superadmin'],
  })
  role: String;
 
  @Prop({ type: [ mongoose.Schema.Types.ObjectId], ref: Alert.name })
  alerts: Alert[];

  @Prop({ required: true, select: false })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);