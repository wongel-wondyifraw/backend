import { User } from "./entities/user.entity";
import { Permission } from "../access/entities/permission.entity";

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
  failed_login_attempts?: number;
  locked_until?: Date | null;
  last_login_at?: Date | null;
  created_via?: string;
  email_verified_at?: Date | null;
  mfa_enabled?: boolean;
}

export function toUserResponse(
  user: User,
  includePermissions = false,
): UserResponseDto {
  const roleKey = user.roleEntity?.key ?? user.role ?? "staff";
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
    failed_login_attempts: user.failed_login_attempts,
    locked_until: user.locked_until,
    last_login_at: user.last_login_at,
    created_via: user.created_via,
    email_verified_at: user.email_verified_at,
    mfa_enabled: user.mfa_enabled,
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
