import { PermissionCondition, EvaluationContext } from './types';
/**
 * Evaluates a permission condition against the provided context
 * @param condition The condition to evaluate
 * @param context The evaluation context
 * @returns Boolean indicating if condition is satisfied
 */
export declare function evaluateCondition(condition: PermissionCondition, context: EvaluationContext): boolean;
/**
 * Checks if a permission applies to the given action and resource
 */
export declare function permissionMatches(permission: {
    action: string;
    resourceType: string;
}, action: string, resourceType: string): boolean;
//# sourceMappingURL=utils.d.ts.map