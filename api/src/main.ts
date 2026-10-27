import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { AllConfigType } from './config/config.type.js';
import { configureApp } from './utils/configure-app.js';
import { setupSwagger } from './utils/swagger.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AllConfigType>);

  app.use(helmet());
  app.enableShutdownHooks();
  configureApp(app);

  if (
    configService.getOrThrow('app.nodeEnv', { infer: true }) !== 'production'
  ) {
    setupSwagger(app);
  }

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}

await bootstrap();
