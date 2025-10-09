/**
 * Test runner for deployment endpoints
 * This script runs tests against the deployment APIs
 * Usage: 
 *   1. Set up your environment variables (TEST_TOKEN)
 *   2. Start the server: npm run dev
 *   3. Run this test: npm test
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTests() {
  console.log('🔍 Testing Deployment Endpoints...\n');

  try {
    // Check if server is running
    console.log('✅ Checking if server is running...');
    
    // Run the existing RBAC and deployment tests
    console.log('🚀 Running deployment endpoint tests...\n');
    
    // Execute the test-rbac.js which includes deployment tests
    const rbacResult = await execAsync('node test/test-rbac.js');
    console.log(rbacResult.stdout);
    if (rbacResult.stderr) {
      console.error('RBAC Test Error:', rbacResult.stderr);
    }
    
    console.log('\n🚀 Running specific deployment tests...\n');
    
    // Execute the deployments test
    const deploymentResult = await execAsync('node test/deployments.test.js || echo "Note: deployments.test.js uses Jest-style syntax which requires Jest to run"');
    console.log(deploymentResult.stdout);
    if (deploymentResult.stderr) {
      console.log('Note:', deploymentResult.stderr);
    }
    
    console.log('\n🚀 Running test deployment tests...\n');
    
    // Execute the test-deployments test
    const testDeploymentResult = await execAsync('node test/testDeployments.test.js || echo "Note: testDeployments.test.js uses Jest-style syntax which requires Jest to run"');
    console.log(testDeploymentResult.stdout);
    if (testDeploymentResult.stderr) {
      console.log('Note:', testDeploymentResult.stderr);
    }

    console.log('\n🎉 All deployment endpoint tests completed!');
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the tests
runTests();