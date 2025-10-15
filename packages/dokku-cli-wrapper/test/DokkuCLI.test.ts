import { DokkuCLI, DokkuError } from '../src';

// Mock shelljs to avoid actually running commands during tests
jest.mock('shelljs', () => ({
  exec: jest.fn((command: string) => {
    // Mock different responses based on the command
    if (command.includes('apps')) {
      if (command.includes('apps:create') || command.includes('apps:destroy')) {
        return { stdout: '', stderr: '', code: 0 };
      }
      // Mock apps list response
      return { stdout: '=====> My Apps\napp1\napp2\n', stderr: '', code: 0 };
    } else if (command.includes('config')) {
      if (command.includes('config:get')) {
        return { stdout: 'test_value\n', stderr: '', code: 0 };
      } else if (command.includes('config:set') || command.includes('config:unset')) {
        return { stdout: '', stderr: '', code: 0 };
      }
      // Mock general config response
      return { stdout: 'KEY1: value1\nKEY2: value2\n', stderr: '', code: 0 };
    } else if (command.includes('ps:restart') || command.includes('ps:stop') || command.includes('ps:start')) {
      return { stdout: '', stderr: '', code: 0 };
    } else if (command.includes('logs')) {
      return { stdout: 'log line 1\nlog line 2\n', stderr: '', code: 0 };
    } else if (command.includes('ps ') && !command.includes('ps:')) {
      // This handles `ps <appname>` command
      return { stdout: 'log line 1\nlog line 2\n', stderr: '', code: 0 };
    } else if (command.includes('version')) {
      return { stdout: 'v0.26.8\n', stderr: '', code: 0 };
    } else if (command.includes('run')) {
      return { stdout: 'command output', stderr: '', code: 0 };
    } else if (command.includes('git:from-image')) {
      return { stdout: '', stderr: '', code: 0 };
    }
    return { stdout: '', stderr: '', code: 0 };
  }),
}));

const shelljs = jest.requireMock('shelljs');

describe('DokkuCLI', () => {
  let dokku: DokkuCLI;

  beforeEach(() => {
    // Reset mocks before each test
    (shelljs.exec as jest.Mock).mockClear();
    
    // Create a new instance with dryRun=true to prevent actual command execution
    dokku = new DokkuCLI({ dryRun: true });
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const dokku = new DokkuCLI();
      expect(dokku).toBeInstanceOf(DokkuCLI);
    });

    it('should validate SSH port configuration', () => {
      expect(() => {
        new DokkuCLI({ sshPort: 'invalid' });
      }).toThrow(DokkuError);
    });

    it('should accept valid SSH port', () => {
      const dokku = new DokkuCLI({ sshPort: '2222' });
      expect(dokku).toBeInstanceOf(DokkuCLI);
    });
  });

  describe('listApps', () => {
    it('should list apps', async () => {
      // Create instance without dryRun to allow mock to run
      const dokku = new DokkuCLI();
      const apps = await dokku.listApps();
      
      expect(apps).toHaveLength(2);
      expect(apps[0].name).toBe('app1');
      expect(apps[1].name).toBe('app2');
    });
  });

  describe('createApp', () => {
    it('should create an app', async () => {
      const result = await dokku.createApp('new-app');
      expect(result).toBe(true);
    });

    it('should sanitize app name', async () => {
      await expect(dokku.createApp('invalid name with spaces')).rejects.toThrow(DokkuError);
    });
  });

  describe('deleteApp', () => {
    it('should delete an app', async () => {
      const result = await dokku.deleteApp('test-app');
      expect(result).toBe(true);
    });
  });

  describe('getAppConfig', () => {
    it('should get app configuration', async () => {
      // Create instance without dryRun to allow mock to run
      const dokku = new DokkuCLI();
      const config = await dokku.getAppConfig('test-app');
      
      expect(config).toEqual({
        KEY1: 'value1',
        KEY2: 'value2'
      });
    });
  });

  describe('getConfigValue', () => {
    it('should get a config value', async () => {
      // Create instance without dryRun to allow mock to run
      const dokku = new DokkuCLI();
      const value = await dokku.getConfigValue('test-app', 'KEY1');
      
      expect(value).toBe('test_value');
    });
  });

  describe('setConfigValue', () => {
    it('should set a config value', async () => {
      const result = await dokku.setConfigValue('test-app', 'NEW_KEY', 'new_value');
      expect(result).toBe(true);
    });
  });

  describe('unsetConfigValue', () => {
    it('should unset a config value', async () => {
      const result = await dokku.unsetConfigValue('test-app', 'KEY1');
      expect(result).toBe(true);
    });
  });

  describe('appExists', () => {
    it('should return true if app exists', async () => {
      // Create instance without dryRun to allow mock to run
      const dokku = new DokkuCLI();
      const exists = await dokku.appExists('test-app');
      
      expect(exists).toBe(true);
    });
  });

  describe('restartApp', () => {
    it('should restart an app', async () => {
      const result = await dokku.restartApp('test-app');
      expect(result).toBe(true);
    });
  });

  describe('stopApp', () => {
    it('should stop an app', async () => {
      const result = await dokku.stopApp('test-app');
      expect(result).toBe(true);
    });
  });

  describe('startApp', () => {
    it('should start an app', async () => {
      const result = await dokku.startApp('test-app');
      expect(result).toBe(true);
    });
  });

  describe('getLogs', () => {
    it('should get app logs', async () => {
      // Create instance without dryRun to allow mock to run
      const dokku = new DokkuCLI();
      const logs = await dokku.getLogs('test-app', 10);
      
      expect(logs).toBe('log line 1\nlog line 2\n');
    });
  });

  describe('deployApp', () => {
    it('should deploy an app', async () => {
      const result = await dokku.deployApp('test-app', 'https://github.com/user/repo.git');
      expect(result).toBe(true);
    });
  });

  describe('runCommand', () => {
    it('should run a command in the app environment', async () => {
      // Create instance without dryRun to allow mock to run
      const dokku = new DokkuCLI();
      const result = await dokku.runCommand('test-app', 'echo hello');
      
      expect(result.stdout).toBe('command output');
    });
  });

  describe('getAppProcesses', () => {
    it('should get app processes', async () => {
      // Create instance without dryRun to allow mock to run
      const dokku = new DokkuCLI();
      const processes = await dokku.getAppProcesses('test-app');
      
      expect(processes).toBe('log line 1\nlog line 2\n');
    });
  });
});