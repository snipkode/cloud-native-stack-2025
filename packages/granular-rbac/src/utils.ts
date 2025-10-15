import { PermissionCondition, User, Resource, EvaluationContext } from './types';

/**
 * Evaluates a permission condition against the provided context
 * @param condition The condition to evaluate
 * @param context The evaluation context
 * @returns Boolean indicating if condition is satisfied
 */
export function evaluateCondition(
  condition: PermissionCondition,
  context: EvaluationContext
): boolean {
  const { user, resource } = context;

  switch (condition.type) {
    case 'user':
      return evaluateUserCondition(condition, user);
    case 'resource':
      return evaluateResourceCondition(condition, resource);
    case 'context':
      return evaluateContextCondition(condition, context);
    case 'function':
      if (condition.customFunction) {
        return condition.customFunction(context, user, resource);
      }
      return false;
    default:
      return false;
  }
}

/**
 * Evaluates a user-based condition
 */
function evaluateUserCondition(condition: PermissionCondition, user: User): boolean {
  if (!condition.field) return false;

  const userValue = getNestedProperty(user, condition.field);
  return compareValues(userValue, condition.value, condition.operator);
}

/**
 * Evaluates a resource-based condition
 */
function evaluateResourceCondition(condition: PermissionCondition, resource: Resource): boolean {
  if (!condition.field) return false;

  const resourceValue = getNestedProperty(resource, condition.field);
  return compareValues(resourceValue, condition.value, condition.operator);
}

/**
 * Evaluates a context-based condition
 */
function evaluateContextCondition(condition: PermissionCondition, context: EvaluationContext): boolean {
  if (!condition.field) return false;

  const contextValue = getNestedProperty(context, condition.field);
  return compareValues(contextValue, condition.value, condition.operator);
}

/**
 * Compares two values based on the operator
 */
function compareValues(value1: any, value2: any, operator: string): boolean {
  switch (operator) {
    case 'eq':
      return value1 === value2;
    case 'ne':
      return value1 !== value2;
    case 'gt':
      return value1 > value2;
    case 'gte':
      return value1 >= value2;
    case 'lt':
      return value1 < value2;
    case 'lte':
      return value1 <= value2;
    case 'in':
      return Array.isArray(value2) && value2.includes(value1);
    case 'nin':
      return Array.isArray(value2) && !value2.includes(value1);
    case 'contains':
      if (typeof value1 === 'string' && typeof value2 === 'string') {
        return value1.includes(value2);
      } else if (Array.isArray(value1)) {
        return value1.includes(value2);
      }
      return false;
    case 'regex':
      if (typeof value1 === 'string' && typeof value2 === 'string') {
        const regex = new RegExp(value2);
        return regex.test(value1);
      }
      return false;
    default:
      return false;
  }
}

/**
 * Gets a nested property value using dot notation (e.g., 'profile.email')
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Checks if a permission applies to the given action and resource
 */
export function permissionMatches(permission: { action: string; resourceType: string }, action: string, resourceType: string): boolean {
  return permission.action === action && permission.resourceType === resourceType;
}