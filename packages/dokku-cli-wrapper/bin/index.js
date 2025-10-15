#!/usr/bin/env node

const { DokkuCLI } = require('./dist');

// Example usage
async function main() {
  console.log('Dokku CLI Wrapper - Example');
  
  try {
    // Create an instance in dry-run mode to demonstrate without actually executing commands
    const dokku = new DokkuCLI({ dryRun: true });
    
    console.log('DokkuCLI instance created successfully!');
    console.log('You can now use methods like:');
    console.log('- dokku.listApps()');
    console.log('- dokku.createApp(appName)');
    console.log('- dokku.deleteApp(appName)');
    console.log('- dokku.getAppConfig(appName)');
    console.log('- And many more...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();