export const SYSTEM_ROLE_ADMIN_KEY = 'admin';

export interface PermissionCatalogEntry {
  slug: string;
  name: string;
  category: string;
  description?: string;
}

export interface SystemRoleDefinition {
  key: string;
  name: string;
  description?: string;
  permissionSlugs: string[] | '*';
}
