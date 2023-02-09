import { forwardRef, Module } from '@nestjs/common';
import { ChildService } from './child.service';
import { ChildController } from './child.controller';
import { ChildSchema } from './entities/child.entity'
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [ChildController],
  providers: [ChildService],
  imports: [
    MongooseModule.forFeature([{ name: 'Child', schema: ChildSchema}]),
    forwardRef(() => UserModule)
  ],
  exports: [ChildService]
})
export class ChildModule {}
