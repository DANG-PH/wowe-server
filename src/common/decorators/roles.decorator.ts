import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

/** Yêu cầu người dùng có một trong các vai trò chỉ định. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
