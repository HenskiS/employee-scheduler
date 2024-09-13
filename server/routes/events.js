const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Technician = require('../models/Technician');
const authMiddleware = require('../middleware/auth');

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { technicianIds, ...eventData } = req.body;
    const event = await Event.create({ ...eventData, createdBy: req.user.id });

    if (technicianIds && technicianIds.length > 0) {
      await event.addTechnicians(technicianIds);
    }

    const createdEvent = await Event.findByPk(event.id, {
      include: [{ model: Technician, through: { attributes: [] } }]
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.findAll({ include: [{ model: Technician, through: { attributes: [] } }] });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific event
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, { include: [{ model: Technician, through: { attributes: [] } }] });
    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (event) {
      await event.update(req.body);
      res.json(event);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an event
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (event) {
      await event.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign a technician to an event
router.post('/:id/assign', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    const technician = await Technician.findByPk(req.body.technicianId);
    if (event && technician) {
      await event.addTechnician(technician);
      res.json({ message: 'Technician assigned successfully' });
    } else {
      res.status(404).json({ error: 'Event or Technician not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;