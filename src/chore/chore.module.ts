import { Module } from '@nestjs/common';
import { ChoreService } from './chore.service';
import { ChoreController } from './chore.controller';
import { ChoreSchema } from './entities/chore.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { ChildModule } from 'src/child/child.module';

@Module({
  controllers: [ChoreController],
  providers: [ChoreService],
  imports: [
    MongooseModule.forFeature([{ name: 'Chore', schema: ChoreSchema}]),
    UserModule,
    ChildModule
]
})
export class ChoreModule {
  
}
