import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Chưa có xác thực');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      request['user-data'] = payload;
    } catch {
      throw new UnauthorizedException('Xác thực không hợp lệ');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) {
      return undefined;
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return undefined;
    }

    return parts[1];
  }
}
