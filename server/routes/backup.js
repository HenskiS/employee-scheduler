// routes/backup.js
const express = require('express');
const backupService = require('../services/backupService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

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

module.exports = { router };