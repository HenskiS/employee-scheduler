const { app, Tray, Menu, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

class ServerManager {
  constructor() {
    this.tray = null;
    this.serverProcess = null;
    this.pidFile = path.join(__dirname, 'server.pid');
    this.serverScript = path.join(__dirname, '..', 'server', 'app.js');
    this.window = null;
    this.logFile = path.join(__dirname, 'server.log');
  }

  async initialize() {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    await app.whenReady();
    
    this.window = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true
      }
    });

    this.createTray();
    this.recoverServer();
    this.updateTrayMenu();

    app.on('window-all-closed', (e) => {
      e.preventDefault();
    });
  }

  createTray() {
    this.tray = new Tray(path.join(__dirname, 'icon.png'));
    this.tray.setToolTip('Express Server Manager');
    
    // Add click handler to show menu on left click
    this.tray.on('click', () => {
      this.tray.popUpContextMenu();
    });
  }

  openLogFile() {
    const logPath = path.resolve(this.logFile);
    
    if (!fs.existsSync(logPath)) {
      // Create the file if it doesn't exist
      fs.writeFileSync(logPath, '');
    }

    if (process.platform === 'win32') {
      // On Windows, use notepad explicitly
      exec(`notepad.exe "${logPath}"`);
    } else if (process.platform === 'darwin') {
      // On macOS
      exec(`open "${logPath}"`);
    } else {
      // On Linux
      exec(`xdg-open "${logPath}"`);
    }
  }

  startServer() {
    if (this.serverProcess) {
      return;
    }
    
    this.serverProcess = spawn('node', [this.serverScript], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    fs.writeFileSync(this.pidFile, this.serverProcess.pid.toString());

    const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    this.serverProcess.stdout.pipe(logStream);
    this.serverProcess.stderr.pipe(logStream);

    this.serverProcess.on('exit', (code) => {
      this.serverProcess = null;
      this.updateTrayMenu();
      if (code !== 0) {
        fs.appendFileSync(this.logFile, `Server exited with code ${code}\n`);
      }
    });

    this.updateTrayMenu();
  }

  stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    this.updateTrayMenu();
  }

  checkServerStatus() {
    return this.serverProcess !== null;
  }

  updateTrayMenu() {
    const isRunning = this.checkServerStatus();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: isRunning ? '✅ Server is Running' : '❌ Server is Stopped',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Start Server',
        click: () => this.startServer(),
        enabled: !isRunning
      },
      {
        label: 'Stop Server',
        click: () => this.stopServer(),
        enabled: isRunning
      },
      {
        label: 'Restart Server',
        click: () => {
          this.stopServer();
          setTimeout(() => this.startServer(), 1000);
        },
        enabled: isRunning
      },
      { type: 'separator' },
      {
        label: 'Open Server Log',
        click: () => this.openLogFile()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.stopServer();
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  recoverServer() {
    if (fs.existsSync(this.pidFile)) {
      const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
      try {
        process.kill(pid, 0);
        this.serverProcess = { pid };
      } catch (e) {
        fs.unlinkSync(this.pidFile);
      }
    }
  }
}

const manager = new ServerManager();
manager.initialize().catch(console.error);