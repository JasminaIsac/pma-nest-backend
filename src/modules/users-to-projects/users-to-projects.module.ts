import { Module } from '@nestjs/common';
import { UsersToProjectsService } from './users-to-projects.service';
import { UsersToProjectsController } from './users-to-projects.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [UsersToProjectsController],
  providers: [UsersToProjectsService],
  exports: [UsersToProjectsService],
})
export class UsersToProjectsModule {}
