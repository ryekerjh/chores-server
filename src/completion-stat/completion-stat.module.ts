import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompletionStatController } from './completion-stat.controller';
import { CompletionStatService } from './completion-stat.service';
import { CompletionStatSchema } from './entities/completion-stat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CompletionStat', schema: CompletionStatSchema },
    ]),
  ],
  controllers: [CompletionStatController],
  providers: [CompletionStatService],
  exports: [CompletionStatService],
})
export class CompletionStatModule {}
