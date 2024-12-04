const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(userDataPath) {
    this.configPath = path.join(userDataPath, 'config.json');
    this.defaultConfig = {
      serverPath: path.join(__dirname, '..', 'server', 'app.js'),
      logPath: path.join(userDataPath, 'server.log'),
      pidPath: path.join(userDataPath, 'server.pid')
    };
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.saveConfig(this.defaultConfig);
        return this.defaultConfig;
      }
      
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return { ...this.defaultConfig, ...config };
    } catch (error) {
      console.error('Error loading config:', error);
      return this.defaultConfig;
    }
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  updateServerPath(newPath) {
    const config = this.loadConfig();
    config.serverPath = newPath;
    this.saveConfig(config);
  }

  validateServerPath(serverPath) {
    try {
      return fs.existsSync(serverPath) && 
             fs.statSync(serverPath).isFile() &&
             path.extname(serverPath) === '.js';
    } catch {
      return false;
    }
  }
}

module.exports = ConfigManager;