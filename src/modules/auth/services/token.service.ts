import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  generateToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { userId, email },
      { expiresIn: '30d' }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }
}
