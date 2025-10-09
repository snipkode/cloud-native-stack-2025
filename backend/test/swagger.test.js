import axios from 'axios';

// Base configuration for testing
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const SWAGGER_UI_URL = BASE_URL + '/api-docs';        // Path for swagger UI

describe('Swagger Documentation Endpoints Tests', () => {
  // Test the Swagger UI endpoint
  test('should return Swagger UI page', async () => {
    const response = await axios.get(SWAGGER_UI_URL);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.data).toContain('Swagger UI');
  });

  // Test the Swagger JSON specification endpoint
  test('should return Swagger JSON specification', async () => {
    // For swagger-ui-express, the JSON spec is usually available at the base path with JSON Accept header
    // or it may be at /api-docs-json
    let response;
    
    try {
      // First try to get JSON spec by setting Accept header
      response = await axios.get(`${BASE_URL}/api-docs`, {
        headers: { 'Accept': 'application/json' }
      });
    } catch {
      // If that fails, try the explicit JSON path
      try {
        response = await axios.get(`${BASE_URL}/api-docs-json`);
      } catch {
        // If both fail, try direct access (some implementations provide the raw spec)
        throw new Error('Could not access Swagger JSON specification');
      }
    }
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('openapi');
    expect(response.data.openapi).toMatch(/^3\.\d+\.\d+$/); // Should match OpenAPI version format
    expect(response.data).toHaveProperty('info');
    expect(response.data.info).toHaveProperty('title');
    expect(response.data.info.title).toBe('SaaS PaaS Platform API');
    expect(response.data).toHaveProperty('paths');
    expect(typeof response.data.paths).toBe('object');
  });

  // Verify that documented endpoints exist in the specification
  test('should have deployment endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const swaggerSpec = response.data;
    
    // Check for basic deployment paths (with /api prefix as specified in swagger config)
    // From server.js: swaggerSpec paths have /api prefix added except for root/health endpoints
    expect(swaggerSpec.paths).toHaveProperty('/api/deployments');
    expect(swaggerSpec.paths['/api/deployments']).toHaveProperty('post'); // create deployment
    expect(swaggerSpec.paths['/api/deployments']).toHaveProperty('get');  // get deployments
    
    expect(swaggerSpec.paths).toHaveProperty('/api/deployments/{id}');
    expect(swaggerSpec.paths['/api/deployments/{id}']).toHaveProperty('get');    // get deployment
    expect(swaggerSpec.paths['/api/deployments/{id}']).toHaveProperty('delete'); // delete deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/api/deployments/{id}/restart');
    expect(swaggerSpec.paths['/api/deployments/{id}/restart']).toHaveProperty('post'); // restart deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/api/deployments/{id}/stop');
    expect(swaggerSpec.paths['/api/deployments/{id}/stop']).toHaveProperty('post'); // stop deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/api/deployments/{id}/logs');
    expect(swaggerSpec.paths['/api/deployments/{id}/logs']).toHaveProperty('get'); // get logs
  });

  // Verify that test deployment endpoints exist in the specification
  test('should have test deployment endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/api/test-deployments');
    expect(swaggerSpec.paths['/api/test-deployments']).toHaveProperty('post'); // create test deployment
    expect(swaggerSpec.paths['/api/test-deployments']).toHaveProperty('get');  // get test deployments
    
    expect(swaggerSpec.paths).toHaveProperty('/api/test-deployments/{id}');
    expect(swaggerSpec.paths['/api/test-deployments/{id}']).toHaveProperty('get');    // get test deployment
    expect(swaggerSpec.paths['/api/test-deployments/{id}']).toHaveProperty('delete'); // delete test deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/api/test-deployments/{id}/restart');
    expect(swaggerSpec.paths['/api/test-deployments/{id}/restart']).toHaveProperty('post'); // restart test deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/api/test-deployments/{id}/stop');
    expect(swaggerSpec.paths['/api/test-deployments/{id}/stop']).toHaveProperty('post'); // stop test deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/api/test-deployments/{id}/logs');
    expect(swaggerSpec.paths['/api/test-deployments/{id}/logs']).toHaveProperty('get'); // get test logs
  });

  // Test authentication endpoints are documented
  test('should have authentication endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/api/auth/register');
    expect(swaggerSpec.paths).toHaveProperty('/api/auth/login');
    expect(swaggerSpec.paths).toHaveProperty('/api/auth/profile');
  });

  // Test billing endpoints are documented
  test('should have billing endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/api/billing/transactions');
    expect(swaggerSpec.paths).toHaveProperty('/api/billing/transactions/{id}');
    expect(swaggerSpec.paths).toHaveProperty('/api/billing/credits');
  });

  // Test access control endpoints are documented
  test('should have access control endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/api/access/grant');
    expect(swaggerSpec.paths).toHaveProperty('/api/access/{id}');
  });
});

  // Test the Swagger UI endpoint
  test('should return Swagger UI page', async () => {
    const response = await axios.get(SWAGGER_UI_URL);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.data).toContain('Swagger UI');
  });

  // Verify that documented endpoints exist in the specification
  test('should have deployment endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs-json`).catch(() => 
      axios.get(`${BASE_URL}/api-docs`)
    );
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/deployments');
    expect(swaggerSpec.paths['/deployments']).toHaveProperty('post'); // create deployment
    expect(swaggerSpec.paths['/deployments']).toHaveProperty('get');  // get deployments
    
    expect(swaggerSpec.paths).toHaveProperty('/deployments/{id}');
    expect(swaggerSpec.paths['/deployments/{id}']).toHaveProperty('get');    // get deployment
    expect(swaggerSpec.paths['/deployments/{id}']).toHaveProperty('delete'); // delete deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/deployments/{id}/restart');
    expect(swaggerSpec.paths['/deployments/{id}/restart']).toHaveProperty('post'); // restart deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/deployments/{id}/stop');
    expect(swaggerSpec.paths['/deployments/{id}/stop']).toHaveProperty('post'); // stop deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/deployments/{id}/logs');
    expect(swaggerSpec.paths['/deployments/{id}/logs']).toHaveProperty('get'); // get logs
  });

  // Verify that test deployment endpoints exist in the specification
  test('should have test deployment endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs-json`).catch(() => 
      axios.get(`${BASE_URL}/api-docs`)
    );
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/test-deployments');
    expect(swaggerSpec.paths['/test-deployments']).toHaveProperty('post'); // create test deployment
    expect(swaggerSpec.paths['/test-deployments']).toHaveProperty('get');  // get test deployments
    
    expect(swaggerSpec.paths).toHaveProperty('/test-deployments/{id}');
    expect(swaggerSpec.paths['/test-deployments/{id}']).toHaveProperty('get');    // get test deployment
    expect(swaggerSpec.paths['/test-deployments/{id}']).toHaveProperty('delete'); // delete test deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/test-deployments/{id}/restart');
    expect(swaggerSpec.paths['/test-deployments/{id}/restart']).toHaveProperty('post'); // restart test deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/test-deployments/{id}/stop');
    expect(swaggerSpec.paths['/test-deployments/{id}/stop']).toHaveProperty('post'); // stop test deployment
    
    expect(swaggerSpec.paths).toHaveProperty('/test-deployments/{id}/logs');
    expect(swaggerSpec.paths['/test-deployments/{id}/logs']).toHaveProperty('get'); // get test logs
  });

  // Test authentication endpoints are documented
  test('should have authentication endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs-json`).catch(() => 
      axios.get(`${BASE_URL}/api-docs`)
    );
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/auth/register');
    expect(swaggerSpec.paths).toHaveProperty('/auth/login');
    expect(swaggerSpec.paths).toHaveProperty('/auth/profile');
  });

  // Test billing endpoints are documented
  test('should have billing endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs-json`).catch(() => 
      axios.get(`${BASE_URL}/api-docs`)
    );
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/billing/transactions');
    expect(swaggerSpec.paths).toHaveProperty('/billing/transactions/{id}');
    expect(swaggerSpec.paths).toHaveProperty('/billing/credits');
  });

  // Test access control endpoints are documented
  test('should have access control endpoints documented in Swagger spec', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs-json`).catch(() => 
      axios.get(`${BASE_URL}/api-docs`)
    );
    
    const swaggerSpec = response.data;
    
    expect(swaggerSpec.paths).toHaveProperty('/access/grant');
    expect(swaggerSpec.paths).toHaveProperty('/access/{id}');
  });

// Health check for the documentation itself
describe('Swagger Documentation Accessibility and Completeness', () => {
  test('should have complete API documentation', async () => {
    const response = await axios.get(`${BASE_URL}/api-docs`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const swaggerSpec = response.data;
    
    // Verify essential documentation properties exist
    expect(swaggerSpec).toHaveProperty('info');
    expect(swaggerSpec.info).toHaveProperty('title');
    expect(swaggerSpec.info).toHaveProperty('version');
    expect(swaggerSpec.info).toHaveProperty('description');
    
    // Verify servers are defined
    expect(swaggerSpec).toHaveProperty('servers');
    expect(Array.isArray(swaggerSpec.servers)).toBe(true);
    
    // Verify security schemes are defined
    expect(swaggerSpec).toHaveProperty('components');
    expect(swaggerSpec.components).toHaveProperty('securitySchemes');
    expect(swaggerSpec.components.securitySchemes).toHaveProperty('bearerAuth');
    
    // Verify all expected tags exist
    expect(swaggerSpec).toHaveProperty('tags');
    const tagNames = swaggerSpec.tags.map(tag => tag.name);
    expect(tagNames).toContain('Authentication');
    expect(tagNames).toContain('Deployments');
    expect(tagNames).toContain('Billing');
    expect(tagNames).toContain('Access Control');
  });
  
  test('should be accessible via browser', async () => {
    // Test that the HTML UI is accessible
    const response = await axios.get(`${BASE_URL}/api-docs`);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.data).toContain('Swagger UI');
  });
});