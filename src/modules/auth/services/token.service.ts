import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  generateToken(userId: number, email: string): string {
    return this.jwtService.sign(
      { userId, email },
      { expiresIn: '30d' }
    );
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }
}
