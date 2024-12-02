# Server Manager Setup

The server manager provides a system tray application to start, stop, and monitor the Express server.

## File Structure
```
employee-scheduler/
├── client/
│   └── ... (React code)
├── server/
│   └── ... (Express code)
└── server-manager/
    ├── main.js         (system tray application)
    ├── package.json    
    ├── icon.png        (tray icon image)
    └── node_modules/
```

## Installation

After cloning the repository:

1. Install PM2 globally if you haven't already:
```bash
npm install -g pm2
```

2. Install server manager dependencies:
```bash
cd server-manager
npm install
```

3. Start the manager with PM2:
```bash
pm2 start main.js --name "employee-scheduler-manager"
```

4. Make it start on boot:
```bash
pm2 startup
```
(Run the command it outputs with administrator privileges)

5. Save the PM2 configuration:
```bash
pm2 save
```

## Usage

The system tray icon provides the following options:
- Start Server: Launches the Express server
- Stop Server: Stops the running server
- Restart Server: Stops and restarts the server
- Open Server Log: View server logs
- Quit: Stops the server and closes the manager

Left or right click the tray icon to access these options.

## Troubleshooting

If the server doesn't start:
1. Check the server log file in the server-manager folder
2. Verify the path to your server's main file in `main.js`
3. Ensure all dependencies are installed in both server and server-manager folders
4. Check PM2 logs:
   ```bash
   pm2 logs employee-scheduler-manager
   ```
5. Check PM2 status:
   ```bash
   pm2 status
   ```