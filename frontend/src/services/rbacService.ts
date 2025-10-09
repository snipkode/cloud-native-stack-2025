import { apiService } from './api';
import { UserPermission, Role as RoleType, Permission as PermissionType } from '../types/api';

export type { RoleType as Role, PermissionType as Permission };

// Import the actual types for method signatures, not just for export
type Role = RoleType;
type Permission = PermissionType;

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  expiresAt?: string;
  assignedAt: string;
}

export interface UserRolePermission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  action: string;
}

export interface UserPermissionsResponse {
  userId: string;
  permissions: UserRolePermission[];
}

export class RBACService {
  // Role Management
  async getRoles(): Promise<{ roles: Role[] }> {
    return apiService.getRoles();
  }

  async createRole(roleData: { name: string; description: string }): Promise<{ message: string; role: Role }> {
    return apiService.createRole(roleData);
  }

  async updateRole(roleId: string, roleData: Partial<Role>): Promise<{ message: string; role: Role }> {
    return apiService.updateRole(roleId, roleData);
  }

  async deleteRole(roleId: string): Promise<{ message: string }> {
    return apiService.deleteRole(roleId);
  }

  // Permission Management
  async getPermissions(): Promise<{ permissions: Permission[] }> {
    return apiService.getPermissions();
  }

  async createPermission(permissionData: { name: string; description: string; resourceType: string; action: string }): Promise<{ message: string; permission: Permission }> {
    return apiService.createPermission(permissionData);
  }

  async updatePermission(permissionId: string, permissionData: Partial<Permission>): Promise<{ message: string; permission: Permission }> {
    // apiService doesn't have update method for permissions, so using direct request
    return apiService.request<{ message: string; permission: Permission }>(`/rbac/permissions/${permissionId}`, {
      method: 'PUT',
      body: JSON.stringify(permissionData),
    });
  }

  async deletePermission(permissionId: string): Promise<{ message: string }> {
    return apiService.deletePermission(permissionId);
  }

  // User Role Assignment
  async assignRoleToUser(userId: string, roleId: string, expiresAt?: string): Promise<{ message: string }> {
    // Using direct request since apiService doesn't have this specific method
    return apiService.request<{ message: string }>(`/rbac/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId, expiresAt }),
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<{ message: string }> {
    // Using direct request since apiService doesn't have this specific method
    return apiService.request<{ message: string }>(`/rbac/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // User Permission Assignment
  async assignPermissionToUser(userId: string, permissionId: string, expiresAt?: string, reason?: string): Promise<{ message: string; userPermission: UserPermission }> {
    return apiService.assignUserPermission({ userId, permissionId, expiresAt, reason });
  }

  async removePermissionFromUser(userId: string, permissionId: string): Promise<{ message: string }> {
    return apiService.revokeUserPermission(permissionId); // Note: This method takes the permission ID, not userId and permissionId
  }

  // Role Permission Assignment
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<{ message: string }> {
    return apiService.assignRolePermissions(roleId, [permissionId]);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<{ message: string }> {
    // apiService doesn't have a direct method to remove specific permission from role
    // We'll need to fetch current permissions, remove the specific one, and reassign
    // For now, using direct request
    return apiService.request<{ message: string }>(`/rbac/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  // User Permissions
  async getUserPermissions(userId: string): Promise<{ permissions: UserPermission[] }> {
    return apiService.getUserPermissions(userId);
  }

  async getMyPermissions(): Promise<{ permissions: UserPermission[] }> {
    // apiService doesn't have this specific method
    return apiService.request<{ permissions: UserPermission[] }>('/rbac/my/permissions');
  }
}

export const rbacService = new RBACService();