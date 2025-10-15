/**
 * Resource type definition for the RBAC system
 */
export interface Resource {
  type: string;
  id: string;
  [key: string]: any; // Allow additional properties for specific resource details
}

/**
 * Action type definition for the RBAC system
 */
export interface Action {
  type: string;
  resource: string; // Resource type that this action applies to
  [key: string]: any; // Allow additional properties for specific action details
}

/**
 * Permission definition for the RBAC system
 */
export interface Permission {
  action: string; // Action type
  resourceType: string; // Resource type
  condition?: PermissionCondition; // Optional condition for when the permission applies
  attributes?: string[]; // Optional list of attributes user can access
}

/**
 * Condition for a permission - determines when a permission applies
 */
export interface PermissionCondition {
  type: 'user' | 'resource' | 'context' | 'function';
  field?: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: any;
  customFunction?: (context: any, user: any, resource: any) => boolean;
}

/**
 * Role definition for the RBAC system
 */
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
  parentRoles?: string[]; // Roles this role inherits from
}

/**
 * User definition for the RBAC system
 */
export interface User {
  id: string;
  roles: string[];
  permissions?: Permission[]; // Direct permissions assigned to user (beyond role permissions)
  [key: string]: any; // Allow additional user properties
}

/**
 * Context for permission evaluation
 */
export interface EvaluationContext {
  user: User;
  action: Action;
  resource: Resource;
  [key: string]: any; // Allow additional context
}

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  applicablePermissions?: Permission[];
}