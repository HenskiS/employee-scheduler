const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Technician = require('../models/Technician');
const authMiddleware = require('../middleware/auth');

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ...eventData } = req.body;
    const technicianIds = eventData.attendees;
    // Validate required fields
    if (!eventData.name || !eventData.startTime) {
      return res.status(400).json({ error: 'Name and date are required fields' });
    }

    // Create the event
    const event = await Event.create({
      name: eventData.name,
      description: eventData.description,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      allDay: eventData.isAllDay,
      label: eventData.labelId,
      jobNumber: eventData.jobNumber
    });
    console.log("\n\n\n-----EVENT-----\n")
    console.log(event)
    /*
    // Add technicians if provided
    if (technicianIds && Array.isArray(technicianIds) && technicianIds.length > 0) {
      const technicians = await Technician.findAll({
        where: { id: technicianIds }
      });
      
      if (technicians.length !== technicianIds.length) {
        return res.status(400).json({ error: 'One or more technician IDs are invalid' });
      }
      
      await event.addTechnicians(technicians);
    }
    */
    // Fetch the created event with associated technicians
    const createdEvent = await Event.findByPk(event.id)/*, {
      include: [{ model: Technician, through: { attributes: [] } }]
    });*/

    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'An error occurred while creating the event' });
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