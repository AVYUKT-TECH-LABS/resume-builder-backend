import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import _puppeteer from './puppeteer';
import session from 'express-session';
import * as bodyParser from 'body-parser';
import memoryStore from 'memorystore';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    // Define the regex patterns based on the environment
    const allowedOriginRegexDev = /^https:\/\/(?:[\w-]+\.)*talentxcel\.net$/;
    const allowedOriginRegexProd = /^https:\/\/talentxcel\.net$/;

    // Check the environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    const MemoryStore = memoryStore(session);
    app.use(
        session({
            secret: 'session-secret',
            resave: false,
            saveUninitialized: false,
            store: new MemoryStore({
                checkPeriod: 86400000 // prune expired entries every 24h
            }),
        }),
    );

    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'http://localhost:3001',
                ...(isDevelopment ? [] : ['https://talentxcel.net']),
            ];

            const allowedOriginRegex = isDevelopment
                ? allowedOriginRegexDev
                : allowedOriginRegexProd;

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

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
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
    await _puppeteer();
    await app.listen(port);
}

bootstrap();
