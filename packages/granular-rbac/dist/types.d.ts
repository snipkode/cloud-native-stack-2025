/**
 * Resource type definition for the RBAC system
 */
export interface Resource {
    type: string;
    id: string;
    [key: string]: any;
}
/**
 * Action type definition for the RBAC system
 */
export interface Action {
    type: string;
    resource: string;
    [key: string]: any;
}
/**
 * Permission definition for the RBAC system
 */
export interface Permission {
    action: string;
    resourceType: string;
    condition?: PermissionCondition;
    attributes?: string[];
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
    parentRoles?: string[];
}
/**
 * User definition for the RBAC system
 */
export interface User {
    id: string;
    roles: string[];
    permissions?: Permission[];
    [key: string]: any;
}
/**
 * Context for permission evaluation
 */
export interface EvaluationContext {
    user: User;
    action: Action;
    resource: Resource;
    [key: string]: any;
}
/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
    applicablePermissions?: Permission[];
}
//# sourceMappingURL=types.d.ts.map