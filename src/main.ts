import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationExceptionFilter } from './common/filters/validation.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Exception Filters
  app.useGlobalFilters(new ValidationExceptionFilter());

  // Validări globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 400,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Project Management API')
    .setDescription('API pentru managementul proiectelor cu autentificare JWT, conversații criptate și gestionarea echipelor')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Autentificare și management cont')
    .addTag('users', 'Utilizatori')
    .addTag('projects', 'Proiecte')
    .addTag('categories', 'Categorii proiecte')
    .addTag('tasks', 'Task-uri proiecte')
    .addTag('conversations', 'Conversații (private/grup)')
    .addTag('messages', 'Mesaje criptate')
    .addTag('users-to-projects', 'Gestionare echipă')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});