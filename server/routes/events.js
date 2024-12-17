const express = require('express');
const router = express.Router();
const sequelize = require('../config/database')
const { Op } = require('sequelize')
const {Event, RecurrenceRule, Technician, Doctor} = require('../models/index');
const authMiddleware = require('../middleware/auth');
const RRule = require('rrule').RRule;

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, startTime, endTime, Technicians, isRecurring, rule, ...otherEventData } = req.body;

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
      if (Technicians && Technicians.length > 0) {
        const techs = await Technician.findAll({
          where: { id: Technicians.map(tech=>tech.id) },
          transaction: t
        });
        await event.setTechnicians(techs, { transaction: t });
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
      include: [{ model: Technician, through: { attributes: [] } }, { model: Doctor }]
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
    // Add one day to end date to include the full end date
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date range provided' });
    }
    
    // Fetch all events in range and their recurrence rules
    const events = await Event.findAll({
      include: [
        { 
          model: Technician, 
          through: { attributes: [] }
        },
        {
          model: RecurrenceRule,
          required: false
        },
        { model: Doctor}
      ],
      where: {
        [Op.or]: [
          // Events starting within the range
          { startTime: { [Op.between]: [startDate, endDate] } },
          // Recurring events that might have instances in the range
          { '$RecurrenceRule.id$': { [Op.not]: null } }
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
      // Note: We use < endDate (not <=) because endDate is now the next day
      if (eventStart >= startDate && eventStart < endDate) {
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
              // Skip if this instance is the original event
              if (date.getTime() === eventStart.getTime()) {
                return null;
              }
              // set start time to event start time
              const instanceStart = new Date(date);
              instanceStart.setHours(eventStart.getHours());
              instanceStart.setMinutes(eventStart.getMinutes());
              instanceStart.setSeconds(eventStart.getSeconds());
              instanceStart.setMilliseconds(eventStart.getMilliseconds());
              
              const instanceEnd = new Date(instanceStart.getTime() + eventDuration);
              
              return {
                ...event.toJSON(),
                startTime: instanceStart.toISOString(),
                endTime: instanceEnd.toISOString(),
                isRecurring: true
              };
            }).filter(Boolean) // Remove null entries
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
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Technician, through: { attributes: [] } },
        { model: Doctor }
      ]
    });
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
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: RecurrenceRule },
        { model: Technician }
      ]
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if the doctor is being changed
    if (req.body.DoctorId && req.body.DoctorId !== event.DoctorId) {
      const newDoctor = await Doctor.findByPk(req.body.DoctorId);
      if (!newDoctor) {
        return res.status(404).json({ error: 'New doctor not found' });
      }
    }

    // Handle RecurrenceRule updates
    if (event.RecurrenceRule) {
      if (!req.body.isRecurring) {
        await RecurrenceRule.destroy({ where: { EventId: event.id } });
      } else if (req.body.RecurrenceRule) {
        const recurrenceRule = await RecurrenceRule.findByPk(event.RecurrenceRule.id);
        if (recurrenceRule) {
          await recurrenceRule.update(req.body.RecurrenceRule);
        }
      }
    } else if (req.body.isRecurring && req.body.RecurrenceRule) {
      const newRule = await RecurrenceRule.create(req.body.RecurrenceRule);
      await event.setRecurrenceRule(newRule);
    }

    // Handle technician updates
    if (req.body.Technicians) {
      const technicianIds = req.body.Technicians.map(tech => tech.id);
      // Verify all technicians exist
      const technicians = await Technician.findAll({
        where: {
          id: technicianIds
        }
      });
      if (technicians.length !== technicianIds.length) {
        return res.status(404).json({ error: 'One or more technicians not found' });
      }

      // Update the technician associations
      await event.setTechnicians(technicianIds);
    }

    // Update the event
    await event.update(req.body);

    // Reload the event with all associations
    await event.reload({
      include: [
        { model: Doctor, attributes: ['id', 'name'] },
        { model: RecurrenceRule },
        { model: Technician }
      ]
    });

    res.json(event);

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete an event
router.delete('/:id', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const event = await Event.findByPk(req.params.id, { transaction: t });
    
    if (event) {
      // Delete associated RecurrenceRules
      await RecurrenceRule.destroy({
        where: { EventId: req.params.id },
        transaction: t
      });
      // Delete the event
      await event.destroy({ transaction: t });
      await t.commit();
      res.status(204).end();
    } else {
      await t.rollback();
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    await t.rollback();
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