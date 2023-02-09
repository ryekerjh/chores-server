import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { AlertSchema } from './entities/alert.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [AlertController],
  providers: [AlertService],
  imports: [
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema}]),
  ],
  exports: [
    AlertService
  ]
})
export class AlertModule {}
