import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '✅ Backend-ul a pornit cu succes! 👋';
  }
}
