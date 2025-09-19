import { RoleEnum } from '@/common/types/role.enum';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<RoleEnum[]>(
      'roles',
      context.getHandler(),
    );

    console.log('Required roles:', requiredRoles);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request['user-data'];

    // console.log('Request user data:', request);
    console.log('User roles:', user);

    return requiredRoles.some((role) => user.role === role);
  }
}
