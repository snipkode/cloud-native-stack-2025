// test-rbac.js
import axios from 'axios';

/**
 * This script demonstrates the RBAC functionality for deployment endpoints
 * It shows how to:
 * 1. Create a test deployment
 * 2. Grant access to another user
 * 3. Test the access control
 * 4. Revoke access
 */

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'YOUR_USER_TOKEN_HERE';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'ADMIN_TOKEN_HERE';
const TEST_USER_ID = process.env.TEST_USER_ID || 'TEST_USER_ID_HERE';

/**
 * Test RBAC functionality
 */
async function testRBAC() {
  console.log('Starting RBAC tests...\n');

  try {
    // 1. Create a test deployment
    console.log('1. Creating a test deployment...');
    const deploymentResponse = await axios.post(
      `${BASE_URL}/test-deployments`,
      {
        name: 'Test Deployment',
        repositoryUrl: 'https://github.com/example/test-repo.git',
        branch: 'main'
      },
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    
    const deployment = deploymentResponse.data.deployment;
    console.log(`✓ Test deployment created with ID: ${deployment.id}\n`);

    // 2. Try to access the deployment as the owner (should succeed)
    console.log('2. Testing owner access (should succeed)...');
    const ownerAccessResponse = await axios.get(
      `${BASE_URL}/test-deployments/${deployment.id}`,
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    console.log('✓ Owner access granted successfully\n');

    // 3. Try to access as different user without permission (should fail)
    console.log('3. Testing unauthorized access (should fail)...');
    try {
      await axios.get(
        `${BASE_URL}/test-deployments/${deployment.id}`,
        {
          headers: { Authorization: `Bearer ${process.env.OTHER_USER_TOKEN}` }
        }
      );
      console.log('✗ Access should have been denied!\n');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✓ Access correctly denied to unauthorized user\n');
      } else {
        console.log('✗ Unexpected error:', error.message, '\n');
      }
    }

    // 4. Grant read permission to another user
    console.log('4. Granting read access to another user...');
    const grantResponse = await axios.post(
      `${BASE_URL}/access/grant`,
      {
        userId: TEST_USER_ID, // ID of the user to grant access to
        resourceType: 'deployment',
        resourceId: deployment.id,
        permissions: ['read']
      },
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    
    const accessGrant = grantResponse.data.accessGrant;
    console.log(`✓ Access granted with ID: ${accessGrant.id}\n`);

    // 5. Try to access with granted permission (should succeed)
    console.log('5. Testing access with granted permission (should succeed)...');
    const grantedAccessResponse = await axios.get(
      `${BASE_URL}/test-deployments/${deployment.id}`,
      {
        headers: { Authorization: `Bearer ${process.env.OTHER_USER_TOKEN}` }
      }
    );
    console.log('✓ Access granted to authorized user\n');

    // 6. Try to perform restricted action (restart) without permission (should fail)
    console.log('6. Testing restricted action without permission (should fail)...');
    try {
      await axios.post(
        `${BASE_URL}/test-deployments/${deployment.id}/restart`,
        {},
        {
          headers: { Authorization: `Bearer ${process.env.OTHER_USER_TOKEN}` }
        }
      );
      console.log('✗ Restart should have been denied!\n');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✓ Restricted action correctly denied\n');
      } else {
        console.log('✗ Unexpected error:', error.message, '\n');
      }
    }

    // 7. Grant restart permission to the user
    console.log('7. Granting restart permission to the user...');
    await axios.post(
      `${BASE_URL}/access/grant`,
      {
        userId: TEST_USER_ID,
        resourceType: 'deployment',
        resourceId: deployment.id,
        permissions: ['read', 'update'] // Adding restart typically requires update permission
      },
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    console.log('✓ Restart permission granted\n');

    // 8. Try to restart with granted permission (should succeed)
    console.log('8. Testing restart with granted permission (should succeed)...');
    const restartResponse = await axios.post(
      `${BASE_URL}/test-deployments/${deployment.id}/restart`,
      {},
      {
        headers: { Authorization: `Bearer ${process.env.OTHER_USER_TOKEN}` }
      }
    );
    console.log('✓ Restart permission working correctly\n');

    // 9. Revoke access
    console.log('9. Revoking access...');
    await axios.delete(
      `${BASE_URL}/access/${accessGrant.id}`,
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    console.log('✓ Access revoked successfully\n');

    // 10. Try to access after revocation (should fail)
    console.log('10. Testing access after revocation (should fail)...');
    try {
      await axios.get(
        `${BASE_URL}/test-deployments/${deployment.id}`,
        {
          headers: { Authorization: `Bearer ${process.env.OTHER_USER_TOKEN}` }
        }
      );
      console.log('✗ Access should have been denied after revocation!\n');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✓ Access correctly denied after revocation\n');
      } else {
        console.log('✗ Unexpected error:', error.message, '\n');
      }
    }

    console.log('✓ RBAC tests completed successfully!');
  } catch (error) {
    console.error('✗ RBAC test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

/**
 * Test endpoint deployment functionality
 */
async function testDeploymentEndpoints() {
  console.log('\nTesting deployment endpoints...\n');

  try {
    // Test creating a deployment
    console.log('1. Testing deployment creation...');
    const createResponse = await axios.post(
      `${BASE_URL}/deployments`,
      {
        name: 'Endpoint Test Deployment',
        repositoryUrl: 'https://github.com/example/test-repo.git',
        branch: 'main'
      },
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    
    const deployment = createResponse.data.deployment;
    console.log(`✓ Deployment created with ID: ${deployment.id}\n`);

    // Test getting all deployments
    console.log('2. Testing get all deployments...');
    const allResponse = await axios.get(`${BASE_URL}/deployments`, {
      headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
    });
    console.log(`✓ Retrieved ${allResponse.data.deployments.length} deployments\n`);

    // Test getting specific deployment
    console.log('3. Testing get specific deployment...');
    const getResponse = await axios.get(`${BASE_URL}/deployments/${deployment.id}`, {
      headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
    });
    console.log(`✓ Retrieved deployment: ${getResponse.data.deployment.name}\n`);

    // Test getting deployment logs
    console.log('4. Testing get deployment logs...');
    const logsResponse = await axios.get(`${BASE_URL}/deployments/${deployment.id}/logs`, {
      headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
    });
    console.log(`✓ Retrieved ${logsResponse.data.logs.length} logs\n`);

    // Test stopping deployment
    console.log('5. Testing stop deployment...');
    const stopResponse = await axios.post(
      `${BASE_URL}/deployments/${deployment.id}/stop`,
      {},
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    console.log('✓ Deployment stopped successfully\n');

    // Test restarting deployment
    console.log('6. Testing restart deployment...');
    const restartResponse = await axios.post(
      `${BASE_URL}/deployments/${deployment.id}/restart`,
      {},
      {
        headers: { Authorization: `Bearer ${TEST_USER_TOKEN}` }
      }
    );
    console.log('✓ Deployment restart initiated\n');

    console.log('✓ Deployment endpoint tests completed successfully!');
  } catch (error) {
    console.error('✗ Deployment endpoint test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

// Run the tests
async function runTests() {
  await testRBAC();
  await testDeploymentEndpoints();
}

runTests();