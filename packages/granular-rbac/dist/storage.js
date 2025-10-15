"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStorage = void 0;
/**
 * In-memory storage implementation for backward compatibility
 */
class InMemoryStorage {
    constructor() {
        this.roles = new Map();
        this.users = new Map();
    }
    async initialize() {
        // Nothing needed for in-memory storage
    }
    async storeRole(role) {
        this.roles.set(role.id, role);
    }
    async getRole(roleId) {
        return this.roles.get(roleId) || null;
    }
    async deleteRole(roleId) {
        this.roles.delete(roleId);
    }
    async listRoles() {
        return Array.from(this.roles.values());
    }
    async storeUser(user) {
        this.users.set(user.id, user);
    }
    async getUser(userId) {
        return this.users.get(userId) || null;
    }
    async deleteUser(userId) {
        this.users.delete(userId);
    }
    async listUsers() {
        return Array.from(this.users.values());
    }
    async close() {
        // Nothing needed for in-memory storage
    }
}
exports.InMemoryStorage = InMemoryStorage;
//# sourceMappingURL=storage.js.map