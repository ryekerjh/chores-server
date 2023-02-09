import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserSchema } from './entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ChildModule } from 'src/child/child.module';
import { AlertModule } from 'src/alert/alert.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema}]),
    forwardRef(() => ChildModule),
    AlertModule
  ],
  exports: [UserService]
})
export class UserModule {}
