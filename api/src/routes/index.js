import authRoutes from '../routes/authRoutes.js';
import deploymentRoutes from '../routes/deploymentRoutes.js';
import billingRoutes from '../routes/billingRoutes.js';
import accessRoutes from '../routes/accessRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import adminCreditRoutes from '../routes/adminCreditRoutes.js';
import rbacRoutes from '../routes/rbacRoutes.js';
import testDeploymentRoutes from '../routes/testDeploymentRoutes.js';
import deploymentStatusRoutes from '../routes/deploymentStatusRoutes.js';
import planRoutes from '../routes/planRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.js';
import { errorHandler } from '../middleware/errorHandler.js';

export const setupRoutes = (app) => {
  app.use('/api/billing', billingRoutes);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/deployments', deploymentRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/access', accessRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/credits', adminCreditRoutes);
  app.use('/api/rbac', rbacRoutes);
  app.use('/api/test/deployments', testDeploymentRoutes);
  app.use('/api/deployments', deploymentStatusRoutes);
  app.use('/api/plans', planRoutes);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'SaaS PaaS Platform API',
      version: '1.0.0',
      documentation: '/api-docs',
      endpoints: {
        auth: '/api/auth',
        deployments: '/api/deployments',
        billing: '/api/billing',
        access: '/api/access',
        admin: '/api/admin',
      },
    });
  });

  app.use(errorHandler);
};