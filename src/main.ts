import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationExceptionFilter } from './common/filters/validation.filter';
import helmet from 'helmet';
import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Dezactivăm CSP în dev pentru a permite conexiuni WS
    }),
  );

  app.enableCors({
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalFilters(new ValidationExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]): Error => {
        console.log('❌ VALIDATION FAILED');
        console.log(JSON.stringify(errors, null, 2));

        return new BadRequestException({
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            value: err.value ? JSON.stringify(err.value) : null,
            constraints: err.constraints ?? {},
          })),
        });
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Project Management API')
    .setDescription('API for project management with JWT authentication, encrypted conversations, and team management')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Authentication and account management')
    .addTag('users', 'Users')
    .addTag('projects', 'Projects')
    .addTag('categories', 'Project categories')
    .addTag('tasks', 'Project tasks')
    .addTag('conversations', 'Conversations (private/group)')
    .addTag('messages', 'Encrypted messages')
    .addTag('users-to-projects', 'Team management')
    .addTag('logs', 'Logs')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});