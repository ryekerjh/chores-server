import { Module, forwardRef } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { AlertSchema } from './entities/alert.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { ChildModule } from 'src/child/child.module';

@Module({
  controllers: [AlertController],
  providers: [AlertService],
  imports: [
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema}]),
    forwardRef(() => UserModule),
    forwardRef(() => ChildModule),
  ],
  exports: [
    AlertService  
  ]
})
export class AlertModule {}
