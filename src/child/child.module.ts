import { forwardRef, Module } from '@nestjs/common';
import { ChildService } from './child.service';
import { ChildController } from './child.controller';
import { ChildSchema } from './entities/child.entity'
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { ChoreSchema } from '../chore/entities/chore.entity';
import { UserSchema } from '../user/entities/user.entity';
import { AlertSchema } from '../alert/entities/alert.entity';
import { CompletionStatModule } from '../completion-stat/completion-stat.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [ChildController],
  providers: [ChildService],
  imports: [
    MongooseModule.forFeature([
      { name: 'Child', schema: ChildSchema },
      { name: 'Chore', schema: ChoreSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Alert', schema: AlertSchema },
    ]),
    forwardRef(() => UserModule),
    CompletionStatModule,
    NotificationModule,
  ],
  exports: [ChildService]
})
export class ChildModule {}
