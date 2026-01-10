import 'module-alias/register';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import connectLivereload from 'connect-livereload';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: false, // <-- tắt tất cả log mặc định
  });

  app.setGlobalPrefix('api');

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

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://g52-genspa.xyz',
      'http://g52-genspa.xyz',
      'https://www.g52-genspa.xyz',
      'http://www.g52-genspa.xyz'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  await app.listen(process.env.PORT ?? 8080);

  const url = `http://localhost:${process.env.PORT ?? 8080}/api`;
  // const { default: open } = await import('open');
  // await open(url);

  // const liveReloadServer = livereload.createServer();
  // liveReloadServer.watch(__dirname + '/../');

  app.use(connectLivereload());

  console.log(`🚀 Swagger opened at ${url}`);
}
bootstrap();
