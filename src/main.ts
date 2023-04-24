import { config } from 'dotenv';
config();
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true
  });

  app.use(helmet());
  await app.listen(process.env.PORT || 443);
}
bootstrap();
