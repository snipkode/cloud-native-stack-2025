import request from 'supertest';
import app from '../src/server.js';
import { sequelize } from '../src/config/database.js';
import { User } from '../src/models/index.js';

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-for-e2e-tests';
process.env.MIDTRANS_SERVER_KEY = 'test-midtrans-server-key';
process.env.MIDTRANS_CLIENT_KEY = 'test-midtrans-client-key';
process.env.MIDTRANS_IS_PRODUCTION = 'false';

// Test server instance
let testServer;
let authToken = null;
let userId = null;
let testTransactionId = null;
let testDeploymentId = null;

beforeAll(async () => {
  // Use a separate test database or sync in memory
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  if (testServer) {
    testServer.close();
  }
  await sequelize.close();
});

describe('End-to-End Tests - Complete User Journey', () => {
  test('Complete user journey: register, authenticate, create deployment, top up credits, deploy', async () => {
    // Step 1: Register a new user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test-e2e@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!'
      })
      .expect(201);

    expect(registerResponse.body).toHaveProperty('user');
    expect(registerResponse.body).toHaveProperty('token');
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Step 2: Login and get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-e2e@example.com',
        password: 'SecurePassword123!'
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('token');
    authToken = loginResponse.body.token;

    // Step 3: Get user profile to verify authentication
    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(profileResponse.body.user.email).toBe('test-e2e@example.com');
    expect(profileResponse.body.user.credits).toBe(0); // New users start with 0 credits

    // Step 4: Try to create a deployment without sufficient credits (should fail)
    const insufficientCreditsResponse = await request(app)
      .post('/api/deployments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test E2E Deployment',
        repositoryUrl: 'https://github.com/example/test-repo.git',
        branch: 'main'
      });

    // Should fail with insufficient credits error (402)
    expect(insufficientCreditsResponse.status).toBe(402);
    expect(insufficientCreditsResponse.body.error).toContain('Insufficient credits');

    // Step 5: Create a top-up transaction (simulate payment process)
    const topupResponse = await request(app)
      .post('/api/billing/topup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 50
      })
      .expect(201);

    expect(topupResponse.body).toHaveProperty('transaction');
    expect(topupResponse.body).toHaveProperty('paymentUrl');
    expect(topupResponse.body.transaction.amount).toBe('50.00');
    expect(topupResponse.body.transaction.status).toBe('pending');
    
    testTransactionId = topupResponse.body.transaction.id;

    // Step 6: Get user profile to confirm credits remain 0 (pending payment)
    const profileBeforeWebhook = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(profileBeforeWebhook.body.user.credits).toBe(0);

    // Step 7: Process webhook to simulate successful payment
    const webhookResponse = await request(app)
      .post('/api/billing/webhook')
      .send({
        transaction_id: topupResponse.body.transaction.paymentGatewayId,
        order_id: `TOPUP-${testTransactionId}`,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'bank_transfer',
        status_code: '200',
        gross_amount: '50000'
      })
      .set('x-midtrans-signature', 'test-signature') // This would be calculated in real scenario
      .expect(200);

    expect(webhookResponse.body).toHaveProperty('status');
    expect(webhookResponse.body.status).toBe('completed');
    
    // Step 8: Get user profile to confirm credits were added
    const profileAfterWebhook = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(profileAfterWebhook.body.user.credits).toBe(50); // 0 + 50 = 50

    // Step 9: Now that user has credits, create a deployment (should succeed)
    const deploymentResponse = await request(app)
      .post('/api/deployments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test E2E Deployment',
        repositoryUrl: 'https://github.com/example/test-repo.git',
        branch: 'main'
      })
      .expect(201);

    expect(deploymentResponse.body).toHaveProperty('message');
    expect(deploymentResponse.body).toHaveProperty('deployment');
    expect(deploymentResponse.body.deployment.name).toBe('Test E2E Deployment');
    expect(deploymentResponse.body.deployment.status).toBe('pending');
    
    testDeploymentId = deploymentResponse.body.deployment.id;

    // Step 10: Get all user's deployments to verify creation
    const deploymentsResponse = await request(app)
      .get('/api/deployments')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(deploymentsResponse.body.deployments).toHaveLength(1);
    expect(deploymentsResponse.body.deployments[0].id).toBe(testDeploymentId);
    expect(deploymentsResponse.body.deployments[0].name).toBe('Test E2E Deployment');

    // Step 11: Get specific deployment
    const specificDeploymentResponse = await request(app)
      .get(`/api/deployments/${testDeploymentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(specificDeploymentResponse.body.deployment.id).toBe(testDeploymentId);

    // Step 12: Simulate deployment completion by updating status (in real app this would happen via deployment service)
    // For E2E test, let's create another top-up to test multiple transactions
    const secondTopupResponse = await request(app)
      .post('/api/billing/topup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 25
      })
      .expect(201);

    expect(secondTopupResponse.body.transaction.amount).toBe('25.00');

    // Step 13: Get all billing transactions
    const transactionsResponse = await request(app)
      .get('/api/billing/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(transactionsResponse.body.transactions).toHaveLength(2);
    expect(transactionsResponse.body.transactions[0].type).toBe('topup');
    expect(transactionsResponse.body.transactions[0].status).toBe('pending'); // This would be completed after webhook

    console.log('✅ Complete user journey test passed successfully!');
  }, 30000); // 30 second timeout for this test

  test('Get specific transaction', async () => {
    if (!authToken || !testTransactionId) {
      throw new Error('Previous test must run first');
    }

    const response = await request(app)
      .get(`/api/billing/transactions/${testTransactionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.transaction.id).toBe(testTransactionId);
  }, 10000);

  test('Test deployment actions', async () => {
    if (!authToken || !testDeploymentId) {
      throw new Error('Previous test must run first');
    }

    // Test restarting deployment
    const restartResponse = await request(app)
      .post(`/api/deployments/${testDeploymentId}/restart`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(restartResponse.body).toHaveProperty('message');
    expect(restartResponse.body).toHaveProperty('deployment');
    expect(restartResponse.body.deployment.id).toBe(testDeploymentId);

    // Test stopping deployment
    const stopResponse = await request(app)
      .post(`/api/deployments/${testDeploymentId}/stop`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(stopResponse.body).toHaveProperty('message');
    expect(stopResponse.body).toHaveProperty('deployment');
    expect(stopResponse.body.deployment.id).toBe(testDeploymentId);
    expect(stopResponse.body.deployment.status).toBe('stopped');
  }, 15000);

  test('Test test-deployment endpoints', async () => {
    if (!authToken) {
      throw new Error('Previous test must run first');
    }

    // Create test deployment
    const testDeploymentResponse = await request(app)
      .post('/api/test-deployments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test E2E Test Deployment',
        repositoryUrl: 'https://github.com/example/test-repo.git',
        branch: 'main'
      })
      .expect(201);

    expect(testDeploymentResponse.body).toHaveProperty('deployment');
    expect(testDeploymentResponse.body.deployment.name).toBe('Test E2E Test Deployment');
    
    const testDeploymentId = testDeploymentResponse.body.deployment.id;

    // Get test deployment
    const getTestDeploymentResponse = await request(app)
      .get(`/api/test-deployments/${testDeploymentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getTestDeploymentResponse.body.deployment.id).toBe(testDeploymentId);

    // Get all test deployments
    const getAllTestDeploymentsResponse = await request(app)
      .get('/api/test-deployments')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getAllTestDeploymentsResponse.body.deployments).toHaveLength(1);
  }, 15000);
});

// Additional test to verify complete flow in reverse
describe('End-to-End Tests - Complete User Journey with Cleanup', () => {
  test('Complete flow with proper cleanup and validation', async () => {
    // Verify all steps worked as expected
    expect(authToken).toBeDefined();
    expect(userId).toBeDefined();
    expect(testTransactionId).toBeDefined();
    expect(testDeploymentId).toBeDefined();

    // Get final user profile to confirm state
    const finalProfileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // User should have credits (though they might be consumed by deployment costs)
    expect(typeof finalProfileResponse.body.user.credits).toBe('number');

    // Get final transactions list
    const finalTransactionsResponse = await request(app)
      .get('/api/billing/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Should have at least 2 transactions (the top-ups)
    expect(finalTransactionsResponse.body.transactions.length).toBeGreaterThanOrEqual(2);

    // Get final deployments list
    const finalDeploymentsResponse = await request(app)
      .get('/api/deployments')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Should have at least 1 deployment
    expect(finalDeploymentsResponse.body.deployments.length).toBeGreaterThanOrEqual(1);

    console.log('✅ Complete user journey with validation test passed successfully!');
  }, 10000);
});