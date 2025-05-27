// routes/backup.js
const express = require('express');
const backupService = require('../services/backupService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/backup - List all backups
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

// POST /api/backup/restore - Restore from backup
router.post('/restore', authMiddleware, async (req, res) => {
  const { backupPath } = req.body;
  
  if (!backupPath) {
    return res.status(400).json({ success: false, error: 'Backup path required' });
  }

  try {
    const result = await backupService.restoreBackup(backupPath);
    res.json(result);
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/cleanup - Manual cleanup
router.post('/cleanup', authMiddleware, async (req, res) => {
  try {
    await backupService.cleanupBackups();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/backup/status - Get backup system status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    const totalBackups = Object.values(backups).reduce((sum, arr) => sum + arr.length, 0);
    const totalSize = Object.values(backups)
      .flat()
      .reduce((sum, backup) => sum + backup.size, 0);

    res.json({
      success: true,
      status: {
        totalBackups,
        totalSize,
        byType: {
          hourly: backups.hourly.length,
          daily: backups.daily.length,
          weekly: backups.weekly.length,
          manual: backups.manual.length
        },
        lastBackup: backups.hourly[0]?.created || null
      }
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = { router };