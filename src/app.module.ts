import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserSchema } from './user/entities/user.entity';
import { ChildSchema } from './child/entities/child.entity';
import { AlertSchema } from './alert/entities/alert.entity';
import { ChoreSchema } from './chore/entities/chore.entity';
import { UserModule } from './user/user.module';
import { ChildModule } from './child/child.module';
import { ChoreModule } from './chore/chore.module';
import { AlertModule } from './alert/alert.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true, 
      dbName: 'chores_app',
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema}]),
    MongooseModule.forFeature([{ name: 'Child', schema: ChildSchema}]),
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema}]),
    MongooseModule.forFeature([{ name: 'Chore', schema: ChoreSchema}]),
    UserModule,
    ChildModule,
    ChoreModule,
    AlertModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
