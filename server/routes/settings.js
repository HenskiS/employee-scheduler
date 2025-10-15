const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const authMiddleware = require('../middleware/auth');

const SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');

// GET settings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_PATH, 'utf8');
    const settings = JSON.parse(data);
    res.json(settings);
  } catch (error) {
    console.error('Error reading settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// PUT settings (update)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { maxJobNumber } = req.body;

    if (maxJobNumber === undefined || typeof maxJobNumber !== 'number' || maxJobNumber < 1) {
      return res.status(400).json({ error: 'Invalid maxJobNumber value' });
    }

    const settings = { maxJobNumber };
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
