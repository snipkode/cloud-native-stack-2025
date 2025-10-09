import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SaaS PaaS Platform API',
      version: '1.0.0',
      description: 'REST API for deployment management platform with real-time features',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api-v2.obskt.xyz',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            credits: { type: 'number' },
            status: { type: 'string', enum: ['online', 'away', 'offline'] },
            createdAt: { type: 'string', format: 'date-time' },
            lastActivity: { type: 'string', format: 'date-time' },
          },
        },
        Deployment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            repositoryUrl: { type: 'string' },
            branch: { type: 'string' },
            envVars: { type: 'object', additionalProperties: { type: 'string' } },
            status: { type: 'string', enum: ['pending', 'building', 'deploying', 'deployed', 'failed', 'stopped'] },
            appUrl: { type: 'string' },
            cost: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['topup', 'deduction'] },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'cancelled'] },
            paymentMethod: { type: 'string' },
            paymentGatewayId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AccessGrant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            resourceType: { type: 'string', enum: ['deployment', 'billing', 'user', 'system'] },
            resourceId: { type: 'string', format: 'uuid', nullable: true },
            permissions: { type: 'array', items: { type: 'string' } },
            grantedBy: { type: 'string', format: 'uuid' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        DeploymentLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            deploymentId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['info', 'warning', 'error', 'success', 'build', 'deploy'] },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Plan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            price: { type: 'number' },
            maxApps: { type: 'integer' },
            maxRAM: { type: 'integer' },
            maxCPU: { type: 'integer' },
            maxStorage: { type: 'integer' },
            maxTeamMembers: { type: 'integer' },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
            features: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            resourceType: { type: 'string' },
            action: { type: 'string' },
            systemDefined: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            systemDefined: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserPermission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            permissionId: { type: 'string', format: 'uuid' },
            grantedBy: { type: 'string', format: 'uuid' },
            grantedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            reason: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Deployments', description: 'Deployment management endpoints' },
      { name: 'Billing', description: 'Billing and transactions endpoints' },
      { name: 'Access Control', description: 'Fine-grained access control endpoints' },
      { name: 'RBAC', description: 'Role-Based Access Control management' },
      { name: 'Plans', description: 'Subscription plan management endpoints' },
    ],
  },
  apis: ['./src/routes/*.js'],
  swaggerOptions: {
    apis: ['./src/routes/*.js'],
  },
};

// Add prefix to all paths
export const swaggerSpec = {
  ...swaggerJsdoc(options),
  paths: Object.fromEntries(
    Object.entries(swaggerJsdoc(options).paths).map(([path, definition]) => {
      // Add /api prefix to all paths except for root and health endpoints
      if (!path.startsWith('/api') && !path.startsWith('/health') && !path.startsWith('/api-docs')) {
        return [`/api${path}`, definition];
      }
      return [path, definition];
    })
  ),
};
