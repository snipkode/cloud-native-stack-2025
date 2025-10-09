import axios from 'axios';

// Base configuration for testing
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api/test-deployments';
const TEST_TOKEN = process.env.TEST_TOKEN; // You'll need to provide a valid JWT token for testing

if (!TEST_TOKEN) {
  console.warn('WARNING: TEST_TOKEN environment variable not set. Some tests may fail.');
}

const api = axios.create({
  baseURL: BASE_URL + API_PREFIX,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`,
  },
});

describe('Test Deployments API Tests', () => {
  let testDeploymentId = null;
  const testDeployment = {
    name: 'test-deployment-' + Date.now(),
    repositoryUrl: 'https://github.com/test/test-repo.git',
    branch: 'main',
  };

  // Test deployment creation
  test('should create a new test deployment', async () => {
    try {
      const response = await api.post('/', testDeployment);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('deployment');
      expect(response.data.deployment).toHaveProperty('id');
      expect(response.data.deployment.name).toBe(testDeployment.name);
      expect(response.data.deployment.repositoryUrl).toBe(testDeployment.repositoryUrl);
      
      testDeploymentId = response.data.deployment.id;
      console.log(`Created test deployment with ID: ${testDeploymentId}`);
    } catch (error) {
      console.error('Error creating test deployment:', error.response?.data || error.message);
      throw error;
    }
  });

  // Test getting all test deployments
  test('should get all test deployments for the user', async () => {
    try {
      const response = await api.get('/');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('deployments');
      expect(Array.isArray(response.data.deployments)).toBe(true);
      
      const deploymentExists = response.data.deployments.some(
        deployment => deployment.id === testDeploymentId
      );
      expect(deploymentExists).toBe(true);
    } catch (error) {
      console.error('Error getting test deployments:', error.response?.data || error.message);
      throw error;
    }
  });

  // Test getting specific test deployment
  test('should get a specific test deployment by ID', async () => {
    if (!testDeploymentId) {
      throw new Error('No test deployment ID available for test');
    }

    try {
      const response = await api.get(`/${testDeploymentId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('deployment');
      expect(response.data.deployment.id).toBe(testDeploymentId);
      expect(response.data.deployment.name).toBe(testDeployment.name);
    } catch (error) {
      console.error('Error getting specific test deployment:', error.response?.data || error.message);
      throw error;
    }
  });

  // Test restarting test deployment
  test('should restart a test deployment', async () => {
    if (!testDeploymentId) {
      throw new Error('No test deployment ID available for test');
    }

    try {
      const response = await api.post(`/${testDeploymentId}/restart`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('deployment');
      expect(response.data.deployment.id).toBe(testDeploymentId);
    } catch (error) {
      console.error('Error restarting test deployment:', error.response?.data || error.message);
      throw error;
    }
  });

  // Test stopping test deployment
  test('should stop a test deployment', async () => {
    if (!testDeploymentId) {
      throw new Error('No test deployment ID available for test');
    }

    try {
      const response = await api.post(`/${testDeploymentId}/stop`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('deployment');
      expect(response.data.deployment.id).toBe(testDeploymentId);
    } catch (error) {
      console.error('Error stopping test deployment:', error.response?.data || error.message);
      throw error;
    }
  });

  // Test getting test deployment logs
  test('should get test deployment logs', async () => {
    if (!testDeploymentId) {
      throw new Error('No test deployment ID available for test');
    }

    try {
      const response = await api.get(`/${testDeploymentId}/logs`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('logs');
      expect(Array.isArray(response.data.logs)).toBe(true);
    } catch (error) {
      console.error('Error getting test deployment logs:', error.response?.data || error.message);
      throw error;
    }
  });

  // Test deleting test deployment
  test('should delete a test deployment', async () => {
    if (!testDeploymentId) {
      throw new Error('No test deployment ID available for test');
    }

    try {
      const response = await api.delete(`/${testDeploymentId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
    } catch (error) {
      console.error('Error deleting test deployment:', error.response?.data || error.message);
      throw error;
    }
  });

  // Verify deletion
  test('should return 404 when accessing deleted test deployment', async () => {
    if (!testDeploymentId) {
      throw new Error('No test deployment ID available for test');
    }

    try {
      await api.get(`/${testDeploymentId}`);
      // If we reach this line, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
});

// Test invalid inputs
describe('Test Deployments API Error Handling', () => {
  test('should return 400 for invalid input when creating test deployment', async () => {
    try {
      await api.post('/', {
        name: '', // Invalid: empty name
        repositoryUrl: 'invalid-url', // Invalid: not a URL
      });
      // If we reach this line, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(400);
    }
  });

  test('should return 404 for non-existent test deployment', async () => {
    try {
      await api.get('/non-existent-id');
      // If we reach this line, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
});