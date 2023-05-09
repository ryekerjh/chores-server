import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type ChildDocument = HydratedDocument<Child>;
import { Chore } from '../../chore/entities/chore.entity';
import { Alert } from '../../alert/entities/alert.entity';

@Schema()
export class Child {
  @Prop()
  name: string;

  @Prop()
  color: string;

  @Prop()
  icon: string;
  
  @Prop({ type: [ mongoose.Schema.Types.ObjectId ], ref: Chore.name, unique: true })
  chores: Chore[];

  @Prop({ type: [ mongoose.Schema.Types.ObjectId ], ref: Alert.name })
  alerts: Alert[];

  @Prop()
  completedChores: [{
    _id: string;
    dateCompleted: string;
  }]
}

export const ChildSchema = SchemaFactory.createForClass(Child);