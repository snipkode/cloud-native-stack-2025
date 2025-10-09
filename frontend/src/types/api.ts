export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  status: 'online' | 'away' | 'offline';
  createdAt: string;
  lastActivity: string;
  role?: 'user' | 'admin';
}

export interface Deployment {
  id: string;
  userId: string;
  name: string;
  repositoryUrl: string;
  branch: string;
  envVars: Record<string, string>;
  status: 'pending' | 'building' | 'deploying' | 'deployed' | 'failed' | 'stopped';
  appUrl?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'topup' | 'deduction';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  paymentGatewayId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentLog {
  id: string;
  deploymentId: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'build' | 'deploy';
  message: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessGrant {
  id: string;
  userId: string;
  resourceType: 'deployment' | 'billing' | 'user' | 'system';
  resourceId?: string;
  permissions: string[];
  grantedBy: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  action: string;
  systemDefined: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  systemDefined: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: unknown[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    apps: number;
    storage: number; // in GB
    ram: number; // in MB
    cpu: number;
  };
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageData {
  plan: Plan;
  used: {
    apps: number;
    storage: number; // in GB
    ram: number; // in MB
    cpu: number;
  };
  available: {
    apps: number;
    storage: number; // in GB
    ram: number; // in MB
    cpu: number;
  };
}
