import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Define the regex pattern for dynamic PR preview domains
  const allowedOriginRegex = /^https:\/\/(?:[\w-]+\.)*talentxcel\.net$/;

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3001',
        'https://talentxcel.net',
      ];

      // Allow requests with no origin (e.g., mobile apps, curl)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOriginRegex.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Resume Builder')
    .setDescription('The resume builder API description')
    .setVersion('1.0')
    .addCookieAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
