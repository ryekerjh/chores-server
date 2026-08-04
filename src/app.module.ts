import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
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
import { AuthModule } from './auth/auth.module';
import { CompletionStatModule } from './completion-stat/completion-stat.module';
import { CompletionStatSchema } from './completion-stat/entities/completion-stat.entity';
import { NotificationModule } from './notification/notification.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { StripAndCheckRole } from './middlewares/stripAndCheckRole.middleware';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL, { 
      dbName: 'chores_app',
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema}]),
    MongooseModule.forFeature([{ name: 'Child', schema: ChildSchema}]),
    MongooseModule.forFeature([{ name: 'Alert', schema: AlertSchema}]),
    MongooseModule.forFeature([{ name: 'Chore', schema: ChoreSchema}]),
    MongooseModule.forFeature([{ name: 'CompletionStat', schema: CompletionStatSchema}]),
    UserModule,
    ChildModule,
    ChoreModule,
    AlertModule,
    AuthModule,
    CompletionStatModule,
    NotificationModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(StripAndCheckRole)
      .forRoutes({ path: 'user/:id/update-role', method: RequestMethod.PATCH });
  }}
