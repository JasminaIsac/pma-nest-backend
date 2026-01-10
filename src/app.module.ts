import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './modules/user/user.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { UsersToProjectsModule } from './modules/users-to-projects/users-to-projects.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

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
    UserModule,
    ProjectsModule,
    AuthModule,
    CategoriesModule,
    TasksModule,
    ConversationsModule,
    UsersToProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
