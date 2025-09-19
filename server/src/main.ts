import 'module-alias/register';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as livereload from 'livereload';
import connectLivereload from 'connect-livereload';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('GenSpa')
    .setDescription('The GenSpa API description')
    .setVersion('2.0')
    .addTag('genspa')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  await app.listen(process.env.PORT ?? 8080);

  const url = `http://localhost:${process.env.PORT ?? 8080}/api`;
  // const { default: open } = await import('open');
  // await open(url);

  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(__dirname + '/../');

  app.use(connectLivereload());

  console.log(`🚀 Swagger opened at ${url}`);
}
bootstrap();
