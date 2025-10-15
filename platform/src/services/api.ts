import {
  User,
  Deployment,
  Transaction,
  DeploymentLog,
  AccessGrant,
  Permission,
  Role,
  UserPermission,
  AuthResponse,
  ApiError,
  Plan,
  UsageData,
} from '../types/api';
import { CreditAdjustmentRequest, CreditResetRequest, CreditHistoryResponse } from '../types/adminCredit';

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || 'https://api-v2.obskt.xyz') + '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Admin Credit Management methods
  async updateUserCredit(userId: string, data: CreditAdjustmentRequest): Promise<{ message: string; user: User; operation: any }> {
    return this.request(`/admin/credits/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async resetUserCredit(userId: string, data: CreditResetRequest): Promise<{ message: string; user: User; operation: any }> {
    return this.request(`/admin/credits/${userId}/reset`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getUserCreditHistory(userId: string): Promise<CreditHistoryResponse> {
    return this.request(`/admin/credits/${userId}/history`);
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  }

  async register(email: string, password: string, name: string, confirmPassword: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, confirmPassword }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/profile');
  }

  async updateProfile(updates: Partial<User>): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getDeployments(): Promise<{ deployments: Deployment[] }> {
    return this.request<{ deployments: Deployment[] }>('/deployments');
  }

  async getDeployment(id: string): Promise<{ deployment: Deployment }> {
    return this.request<{ deployment: Deployment }>(`/deployments/${id}`);
  }

  async createDeployment(data: {
    name: string;
    repositoryUrl: string;
    branch?: string;
    envVars?: Record<string, string>;
  }): Promise<{ message: string; deployment: Deployment }> {
    return this.request<{ message: string; deployment: Deployment }>('/deployments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeployment(
    id: string,
    data: Partial<Deployment>
  ): Promise<{ message: string; deployment: Deployment }> {
    return this.request<{ message: string; deployment: Deployment }>(`/deployments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeployment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/deployments/${id}`, {
      method: 'DELETE',
    });
  }

  async getDeploymentLogs(id: string): Promise<{ logs: DeploymentLog[] }> {
    return this.request<{ logs: DeploymentLog[] }>(`/deployments/${id}/logs`);
  }

  async restartDeployment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/deployments/${id}/restart`, {
      method: 'POST',
    });
  }

  async stopDeployment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/deployments/${id}/stop`, {
      method: 'POST',
    });
  }

  async getTransactions(): Promise<{ transactions: Transaction[] }> {
    return this.request<{ transactions: Transaction[] }>('/billing/transactions');
  }

  async createTransaction(data: {
    type: 'topup' | 'deduction';
    amount: number;
    paymentMethod?: string;
  }): Promise<{ message: string; transaction: Transaction }> {
    return this.request<{ message: string; transaction: Transaction }>('/billing/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAccessGrants(userId?: string): Promise<{ accessGrants: AccessGrant[] }> {
    const query = userId ? `?userId=${userId}` : '';
    return this.request<{ accessGrants: AccessGrant[] }>(`/access${query}`);
  }

  async grantAccess(data: {
    userId: string;
    resourceType: 'deployment' | 'billing' | 'user' | 'system';
    resourceId?: string;
    permissions: string[];
    expiresAt?: string;
  }): Promise<{ message: string; accessGrant: AccessGrant }> {
    return this.request<{ message: string; accessGrant: AccessGrant }>('/access/grant', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeAccess(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/access/${id}`, {
      method: 'DELETE',
    });
  }

  async checkAccess(
    resourceType: string,
    permission: string,
    resourceId?: string
  ): Promise<{ hasAccess: boolean; reason?: string }> {
    const params = new URLSearchParams({
      resourceType,
      permission,
      ...(resourceId && { resourceId }),
    });
    return this.request<{ hasAccess: boolean; reason?: string }>(
      `/access/check?${params.toString()}`
    );
  }

  async getPermissions(): Promise<{ permissions: Permission[] }> {
    return this.request<{ permissions: Permission[] }>('/rbac/permissions');
  }

  async createPermission(data: {
    name: string;
    description: string;
    resourceType: string;
    action: string;
  }): Promise<{ message: string; permission: Permission }> {
    return this.request<{ message: string; permission: Permission }>('/rbac/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePermission(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/rbac/permissions/${id}`, {
      method: 'DELETE',
    });
  }

  async getRoles(): Promise<{ roles: Role[] }> {
    return this.request<{ roles: Role[] }>('/rbac/roles');
  }

  async createRole(data: {
    name: string;
    description: string;
  }): Promise<{ message: string; role: Role }> {
    return this.request<{ message: string; role: Role }>('/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(
    id: string,
    data: Partial<Role>
  ): Promise<{ message: string; role: Role }> {
    return this.request<{ message: string; role: Role }>(`/rbac/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/rbac/roles/${id}`, {
      method: 'DELETE',
    });
  }

  async assignRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/rbac/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionIds }),
    });
  }

  async getUserPermissions(userId: string): Promise<{ permissions: UserPermission[] }> {
    return this.request<{ permissions: UserPermission[] }>(`/rbac/users/${userId}/permissions`);
  }

  async assignUserPermission(data: {
    userId: string;
    permissionId: string;
    expiresAt?: string;
    reason?: string;
  }): Promise<{ message: string; userPermission: UserPermission }> {
    return this.request<{ message: string; userPermission: UserPermission }>(
      '/rbac/user-permissions',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async revokeUserPermission(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/rbac/user-permissions/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/admin/users');
  }

  async getUserById(id: string): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/admin/users/${id}`);
  }

  async updateUser(
    id: string,
    data: Partial<User>
  ): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllDeployments(): Promise<{ deployments: Deployment[] }> {
    return this.request<{ deployments: Deployment[] }>('/admin/deployments');
  }

  async getDeploymentById(id: string): Promise<{ deployment: Deployment }> {
    return this.request<{ deployment: Deployment }>(`/admin/deployments/${id}`);
  }

  async updateDeploymentAdmin(
    id: string,
    data: Partial<Deployment>
  ): Promise<{ message: string; deployment: Deployment }> {
    return this.request<{ message: string; deployment: Deployment }>(`/admin/deployments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeploymentAdmin(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/deployments/${id}`, {
      method: 'DELETE',
    });
  }

  // Plans and Subscription methods
  async getPlans(): Promise<{ plans: Plan[] }> {
    return this.request<{ plans: Plan[] }>('/plans');
  }

  async getMyPlan(): Promise<{ plan: Plan; usage: UsageData }> {
    return this.request<{ plan: Plan; usage: UsageData }>('/plans/my-plan');
  }

  async subscribeToPlan(planId: string): Promise<{ message: string; paymentUrl: string }> {
    return this.request<{ message: string; paymentUrl: string }>('/billing/subscribe-plan', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async getPlanUsage(): Promise<{ usage: UsageData }> {
    return this.request<{ usage: UsageData }>('/deployments/usage');
  }

  // Billing methods
  async topUpCredits(amount: number): Promise<{ message: string; paymentUrl: string }> {
    return this.request<{ message: string; paymentUrl: string }>('/billing/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getAllTransactions(): Promise<{ transactions: Transaction[] }> {
    return this.request<{ transactions: Transaction[] }>('/billing/transactions');
  }

  async getTransactionsByUser(userId: string): Promise<{ transactions: Transaction[] }> {
    return this.request<{ transactions: Transaction[] }>(`/admin/users/${userId}/transactions`);
  }

  async updateTransaction(
    id: string,
    data: Partial<Transaction>
  ): Promise<{ message: string; transaction: Transaction }> {
    return this.request<{ message: string; transaction: Transaction }>(`/admin/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin stats method
  async getAdminStats(): Promise<{ 
    totalUsers: number; 
    totalDeployments: number; 
    totalRevenue: number; 
    activeSubscriptions: number;
  }> {
    return this.request<{ 
      totalUsers: number; 
      totalDeployments: number; 
      totalRevenue: number; 
      activeSubscriptions: number;
    }>('/admin/stats');
  }
}

export const apiService = new ApiService();
