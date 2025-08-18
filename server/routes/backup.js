// routes/backup.js
const express = require('express');
const path = require('path'); // This was missing!
const backupService = require('../services/backupService');
const dropboxAuth = require('../services/dropboxAuth');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Dropbox setup routes (NO AUTH REQUIRED)
router.get('/setup/dropbox', async (req, res) => {
  try {
    const authUrl = dropboxAuth.getAuthUrl();
    console.log('🔗 Redirecting to Dropbox authorization...');
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Failed to generate auth URL:', error.message);
    res.status(500).send('Failed to start authorization: ' + error.message);
  }
});

router.get('/auth/dropbox/callback', async (req, res) => {
  try {
    const code = req.query.code;
    
    if (!code) {
      throw new Error('No authorization code received');
    }

    console.log('🔑 Exchanging authorization code for tokens...');
    await dropboxAuth.exchangeCodeForTokens(code);
    
    // Refresh the backup service connection
    await backupService.refreshDropboxConnection();
    
    res.send(`
      <h1>✅ Dropbox Authorization Successful!</h1>
      <p>Your app is now connected to Dropbox. You can close this window.</p>
      <p>Backups will now be automatically uploaded to Dropbox.</p>
    `);
    
    console.log('✅ Dropbox authorization complete!');
  } catch (error) {
    console.error('❌ Authorization failed:', error.message);
    res.status(500).send(`
      <h1>❌ Authorization Failed</h1>
      <p>Error: ${error.message}</p>
      <p>Please try again by visiting <a href="/api/backup/setup/dropbox">/api/backup/setup/dropbox</a></p>
    `);
  }
});

router.get('/dropbox/status', async (req, res) => {
  try {
    const client = dropboxAuth.getDropboxClient();
    if (client) {
      const account = await client.usersGetCurrentAccount();
      res.json({
        connected: true,
        account: account.result.name.display_name,
        email: account.result.email
      });
    } else {
      res.json({
        connected: false,
        message: 'Not authorized. Visit /api/backup/setup/dropbox to connect.'
      });
    }
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// Protected backup routes (AUTH REQUIRED)
// GET /api/backup - List all backups (local + cloud)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ success: true, backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup - Create manual backup
router.post('/', authMiddleware, async (req, res) => {
  try {
    const result = await backupService.createBackup('manual');
    res.json(result);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/restore - Restore from backup (local or cloud)
router.post('/restore', authMiddleware, async (req, res) => {
  const { backupPath, location } = req.body;
  
  if (!backupPath) {
    return res.status(400).json({ success: false, error: 'Backup path required' });
  }

  try {
    const isDropboxPath = location === 'dropbox';
    const result = await backupService.restoreBackup(backupPath, isDropboxPath);
    res.json(result);
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/cleanup - Manual cleanup (local + cloud)
router.post('/cleanup', authMiddleware, async (req, res) => {
  try {
    await backupService.cleanupBackups();
    res.json({ success: true, message: 'Cleanup completed for local and cloud backups' });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/upload - Manually upload a backup to Dropbox
router.post('/upload', authMiddleware, async (req, res) => {
  const { backupPath, filename } = req.body;
  
  if (!backupPath || !filename) {
    return res.status(400).json({ 
      success: false, 
      error: 'Backup path and filename required' 
    });
  }

  try {
    const result = await backupService.uploadToDropbox(backupPath, filename);
    res.json({ success: true, message: 'Backup uploaded to Dropbox', result });
  } catch (error) {
    console.error('Error uploading to Dropbox:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/download - Download a backup from Dropbox
router.post('/download', authMiddleware, async (req, res) => {
  const { remotePath, filename } = req.body;
  
  if (!remotePath || !filename) {
    return res.status(400).json({ 
      success: false, 
      error: 'Remote path and filename required' 
    });
  }

  try {
    const localPath = path.join(__dirname, '..', 'backups', 'manual', filename);
    const result = await backupService.downloadFromDropbox(remotePath, localPath);
    res.json({ success: true, message: 'Backup downloaded from Dropbox', result });
  } catch (error) {
    console.error('Error downloading from Dropbox:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/backup/status - Get backup system status (enhanced with cloud info)
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = await backupService.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/backup/cloud - List only cloud backups
router.get('/cloud', authMiddleware, async (req, res) => {
  try {
    const cloudBackups = await backupService.listDropboxBackups();
    res.json({ success: true, backups: cloudBackups });
  } catch (error) {
    console.error('Error listing cloud backups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/cloud/cleanup - Clean up only cloud backups
router.post('/cloud/cleanup', authMiddleware, async (req, res) => {
  try {
    await backupService.cleanupDropboxBackups();
    res.json({ success: true, message: 'Cloud backup cleanup completed' });
  } catch (error) {
    console.error('Error during cloud cleanup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/backup/dropbox/test - Test Dropbox connection
router.get('/dropbox/test', authMiddleware, async (req, res) => {
  try {
    const dropboxAuth = require('../services/dropboxAuth');
    const client = dropboxAuth.getDropboxClient();
    
    if (!client) {
      return res.json({ 
        success: false, 
        connected: false, 
        message: 'Dropbox not authorized. Visit /setup/dropbox to connect.' 
      });
    }

    const account = await client.usersGetCurrentAccount();
    res.json({
      success: true,
      connected: true,
      account: {
        name: account.result.name.display_name,
        email: account.result.email
      }
    });
  } catch (error) {
    console.error('Dropbox connection test failed:', error);
    res.json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

// GET /api/backup/dropbox/debug - Debug Dropbox auth state
router.get('/dropbox/debug', authMiddleware, async (req, res) => {
  try {
    const dropboxAuth = require('../services/dropboxAuth');
    const fs = require('fs').promises;
    const path = require('path');
    
    const tokenFile = path.join(__dirname, '..', 'config', '.dropbox_tokens.json');
    
    let tokenFileExists = false;
    let tokenFileContent = null;
    
    try {
      await fs.access(tokenFile);
      tokenFileExists = true;
      const content = await fs.readFile(tokenFile, 'utf8');
      tokenFileContent = JSON.parse(content);
    } catch (error) {
      tokenFileExists = false;
    }
    
    const client = dropboxAuth.getDropboxClient();
    
    res.json({
      tokenFile: tokenFile,
      tokenFileExists,
      tokenFileHasAccessToken: tokenFileContent?.access_token ? true : false,
      tokenFileHasRefreshToken: tokenFileContent?.refresh_token ? true : false,
      tokenExpiration: tokenFileContent?.expires_at ? new Date(tokenFileContent.expires_at).toISOString() : null,
      clientExists: !!client,
      envVarsSet: {
        DROPBOX_APP_KEY: !!process.env.DROPBOX_APP_KEY,
        DROPBOX_APP_SECRET: !!process.env.DROPBOX_APP_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// POST /api/backup/dropbox/refresh - Refresh Dropbox connection
router.post('/dropbox/refresh', authMiddleware, async (req, res) => {
  try {
    const success = await backupService.refreshDropboxConnection();
    res.json({
      success: true,
      connected: success,
      message: success ? 'Dropbox connection refreshed successfully' : 'Dropbox not authorized'
    });
  } catch (error) {
    console.error('Dropbox refresh failed:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

module.exports = { router };