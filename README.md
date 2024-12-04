# Schedule Server Manager Setup

A system tray application to manage your Employee Scheduler server. This tool provides an easy-to-use interface for starting, stopping, and monitoring your server without needing to use the command line.

## File Structure
```
employee-scheduler/
├── client/
│   └── ... (React code)
├── server/
│   └── ... (Express code)
└── server-manager/
   ├── main.js           # Main electron application
   ├── configManager.js  # Configuration management
   ├── package.json      
   ├── icon.ico         # Tray icon image
   └── dist/            # Built application files
      └── employee-scheduler-manager Setup.exe  # Installer
```

## Installation

### For Users
1. Install the server code in your desired location
2. Download and run `employee-scheduler-manager Setup.exe`
3. When first launching the application, use the "Set Server Path" option to point to your server's `app.js` file

### For Developers
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Run in development mode:
```bash
npm start
```
4. Build the installer:
```bash
npm run build
```

## Usage

The system tray application provides the following options:

- ✅ Server is Running / ❌ Server is Stopped: Shows current server status
- Start Server: Launches the Express server
- Stop Server: Stops the running server
- Restart Server: Stops and restarts the server
- Open Server Log: View server logs
- Set Server Path: Configure the location of your server's app.js file
- Quit: Stops the server and closes the manager

Left or right click the tray icon to access these options.

## File Locations

When installed, the application stores its files in the following locations:

- Config file: `%APPDATA%\employee-scheduler-manager\config.json`
- Log file: `%APPDATA%\employee-scheduler-manager\server.log`
- PID file: `%APPDATA%\employee-scheduler-manager\server.pid`

## Troubleshooting

If the server doesn't start:
1. Check the server log file via the "Open Server Log" option
2. Verify the server path is correctly set
3. Ensure all server dependencies are installed
4. Check that the server is not already running from another process
5. Make sure your antivirus software isn't blocking the application

## Development Notes

This application is built using:
- Electron
- Node.js
- electron-builder for packaging

To modify the build configuration, see the `build` section in `package.json`.

## License

TBT