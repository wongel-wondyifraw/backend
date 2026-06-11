import { User } from './entities/user.entity';
import { Permission } from '../access/entities/permission.entity';

export interface UserPermissionDto {
  slug: string;
  name: string;
  category: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  role: string;
  avatar_url?: string | null;
  title?: string | null;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  permissions?: UserPermissionDto[];
}

export function toUserResponse(user: User, includePermissions = false): UserResponseDto {
  const roleKey = user.roleEntity?.key ?? user.role ?? 'staff';
  const dto: UserResponseDto = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    middle_name: user.middle_name,
    last_name: user.last_name,
    role: roleKey,
    avatar_url: user.avatar_url,
    title: user.title,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  if (includePermissions && user.roleEntity?.permissions) {
    dto.permissions = user.roleEntity.permissions.map((p: Permission) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
    }));
  }

  return dto;
}
