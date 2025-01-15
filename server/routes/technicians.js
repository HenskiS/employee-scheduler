const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');
const authMiddleware = require('../middleware/auth');

// Create a new technician
router.post('/', authMiddleware, async (req, res) => {
  try {
    const technician = await Technician.create(req.body);
    res.status(201).json(technician);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all technicians
const getTechnicians = async () => {
  try {
    const technicians = await Technician.findAll();
    return technicians;
  } catch (error) {
    throw error;
  }
};
const getTechniciansHandler = async (req, res) => {
  try {
    const technicians = await getTechnicians();
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
router.get('/', authMiddleware, getTechniciansHandler);

// Get a specific technician
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id);
    if (technician) {
      res.json(technician);
    } else {
      res.status(404).json({ error: 'Technician not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a technician
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id);
    if (technician) {
      await technician.update(req.body);
      res.json(technician);
    } else {
      res.status(404).json({ error: 'Technician not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a technician
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id);
    if (technician) {
      await technician.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Technician not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {router, getTechnicians};