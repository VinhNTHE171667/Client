import { RoleEnum } from '@/common/types/role.enum';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

export function Auth(...roles: RoleEnum[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Chưa xác th' }),
  );
}
