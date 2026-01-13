import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { UsersToProjectsModule } from './modules/users-to-projects/users-to-projects.module';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/audit-log.interceptor';
import { LogsModule } from './modules/logs/logs.module';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minut
        limit: 30, // 30 cereri pe minut
      },
      {
        name: 'long',
        ttl: 900000, // 15 minute
        limit: 300, // 300 cereri pe 15 minute
      },
    ]),
    PrismaModule,
    UsersModule,
    ProjectsModule,
    AuthModule,
    CategoriesModule,
    TasksModule,
    ConversationsModule,
    UsersToProjectsModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [ AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
