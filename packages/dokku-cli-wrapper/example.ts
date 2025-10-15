import { DokkuCLI } from './src';

async function example() {
  // Initialize the Dokku CLI wrapper
  const dokku = new DokkuCLI();

  try {
    // List all apps
    console.log('Listing all apps...');
    const apps = await dokku.listApps();
    console.log('Apps:', apps);

    // Create a new app (uncomment to test)
    // await dokku.createApp('test-app');
    // console.log('Created test app');

    // Check if an app exists
    const appExists = await dokku.appExists('my-app');
    console.log('App my-app exists:', appExists);

    // Get app configuration (if app exists)
    if (appExists) {
      const config = await dokku.getAppConfig('my-app');
      console.log('App config:', config);

      // Set a configuration value
      await dokku.setConfigValue('my-app', 'NEW_VAR', 'new_value');
      console.log('Set new configuration value');
    }

    // Get logs for an app (if app exists)
    if (appExists) {
      const logs = await dokku.getLogs('my-app', 10); // Get last 10 lines
      console.log('App logs:', logs);
    }

    // Run a command in the app environment (if app exists)
    if (appExists) {
      const result = await dokku.runCommand('my-app', 'echo "Hello from app"');
      console.log('Command result:', result.stdout);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Also show an example with SSH configuration
async function sshExample() {
  // Initialize the Dokku CLI wrapper with SSH configuration
  const dokku = new DokkuCLI({
    sshHost: 'your-dokku-server.com',
    sshPort: '22'
  });

  try {
    // This will run commands on the remote server
    const apps = await dokku.listApps();
    console.log('Remote apps:', apps);
  } catch (error) {
    console.error('SSH Error:', error);
  }
}

// Run examples
example();
// sshExample(); // Uncomment to run SSH example