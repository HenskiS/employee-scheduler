const express = require('express');
const router = express.Router();
const sequelize = require('../config/database')
const { Op } = require('sequelize')
const {Event, RecurrenceRule, Technician} = require('../models/index');
const authMiddleware = require('../middleware/auth');
const RRule = require('rrule').RRule;

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, startTime, endTime, attendees, isRecurring, rule, ...otherEventData } = req.body;

    // Validate required fields
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: 'Name, start time, and end time are required fields' });
    }

    // Start a transaction
    const result = await sequelize.transaction(async (t) => {
      // Create the event
      const event = await Event.create({
        name,
        startTime,
        endTime,
        isRecurring,
        ...otherEventData
      }, { transaction: t });

      // Associate technicians if attendees are provided
      if (attendees && attendees.length > 0) {
        const technicians = await Technician.findAll({
          where: { id: attendees },
          transaction: t
        });
        await event.setTechnicians(technicians, { transaction: t });
      }

      // Create recurrence rule if provided
      if (isRecurring) {
        try {
          // Validate the recurrence rule
          RRule.fromString(rule);

          await event.createRecurrenceRule({
            rule: rule
          }, { transaction: t });
        } catch (error) {
          await t.rollback();
          return res.status(400).json({ error: 'Invalid recurrence rule' });
        }
      }

      return event;
    });

    // Fetch the created event with associated technicians
    const createdEvent = await Event.findByPk(result.id, {
      include: [{ model: Technician, through: { attributes: [] } }]
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message || 'An error occurred while creating the event' });
  }
});

// Get all events
/*router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.findAll({ include: [{ model: Technician, through: { attributes: [] } }] });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});*/
// Get events in range
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date range provided' });
    }
    
    // Fetch all events and their recurrence rules
    const events = await Event.findAll({
      include: [
        { 
          model: Technician, 
          through: { attributes: [] }
        },
        {
          model: RecurrenceRule,
          required: false
        }
      ],
      where: {
        [Op.or]: [
          // Non-recurring events within the range
          {
            startTime: { [Op.between]: [startDate, endDate] },
            '$RecurrenceRule.id$': null
          },
          // Recurring events (we'll filter these in memory)
          {
            '$RecurrenceRule.id$': { [Op.not]: null }
          }
        ]
      }
    });

    // Expand recurring events
    const expandedEvents = events.flatMap(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const eventDuration = eventEnd - eventStart;
      
      let instances = [];

      // Include the original event if it's within the range
      if (eventStart >= startDate && eventStart <= endDate) {
        instances.push({
          ...event.toJSON(),
          isOriginalEvent: true
        });
      }

      // If it's a recurring event, add the recurrences
      if (event.RecurrenceRule) {
        try {
          const rule = RRule.fromString(event.RecurrenceRule.rule);
          const recurringInstances = rule.between(startDate, endDate);
          
          instances = [
            ...instances,
            ...recurringInstances.map(date => {
              const instanceStart = new Date(date);
              const instanceEnd = new Date(instanceStart.getTime() + eventDuration);
              
              // Create a new object with all properties of the original event
              const recurringInstance = { ...event.toJSON() };
              
              // Override only the startTime and endTime
              recurringInstance.startTime = instanceStart.toISOString();
              recurringInstance.endTime = instanceEnd.toISOString();
              
              // Add an isRecurring flag
              recurringInstance.isRecurring = true;
              
              return recurringInstance;
            })
          ];
        } catch (error) {
          console.error(`Error processing recurring event ${event.id}:`, error);
        }
      }

      return instances;
    });

    res.json(expandedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'An error occurred while fetching events' });
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