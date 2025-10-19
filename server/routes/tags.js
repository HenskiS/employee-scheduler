const express = require('express');
const router = express.Router();
const { Tag } = require('../models/index');
const authMiddleware = require('../middleware/auth');

// Get all tags
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tags = await Tag.findAll({
      order: [['name', 'ASC']]
    });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new tag
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await Tag.create({ name, color });
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update a tag
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, color } = req.body;
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await tag.update({ name, color });
    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a tag
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await tag.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
