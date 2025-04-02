const express = require('express');
const router = express.Router();
const sequelize = require('../config/database')
const { Op } = require('sequelize')
const {Event, Technician, Doctor} = require('../models/index');
const authMiddleware = require('../middleware/auth');
const RRule = require('rrule').RRule;

// Helper function to create recurring events
const createRecurringEvents = async (originalEvent, rule, transaction) => {
  const rrule = RRule.fromString(rule);
  const eventStart = new Date(originalEvent.startTime);
  const eventEnd = new Date(originalEvent.endTime);
  const eventDuration = eventEnd - eventStart;
  
  // Get all recurrence dates (limit to reasonable future date, e.g., 2 years)
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);
  const recurringDates = rrule.between(eventStart, futureDate);
  
  // Skip the first date if it matches the original event
  const dates = recurringDates.filter(date => 
    date.getTime() !== eventStart.getTime()
  );

  // Create events for each recurrence
  const recurrencePromises = dates.map(date => {
    const instanceStart = new Date(date);
    instanceStart.setHours(eventStart.getHours());
    instanceStart.setMinutes(eventStart.getMinutes());
    
    const instanceEnd = new Date(instanceStart.getTime() + eventDuration);
    
    return Event.create({
      name: originalEvent.name,
      description: originalEvent.description,
      startTime: instanceStart,
      endTime: instanceEnd,
      allDay: originalEvent.allDay,
      label: originalEvent.label,
      jobNumber: originalEvent.jobNumber,
      isRecurring: true,
      originalEventId: originalEvent.originalEventId || originalEvent.id,
      DoctorId: originalEvent.DoctorId,
      recurrencePattern: rule,
      createdBy: originalEvent.createdBy,
      forAll: originalEvent.forAll
    }, { transaction });
  });

  const recurrences = await Promise.all(recurrencePromises);
  
  // Copy technician assignments
  if (originalEvent.Technicians && originalEvent.Technicians.length > 0) {
    await Promise.all(recurrences.map(async (recurrence) => {
      await recurrence.setTechnicians(
        originalEvent.Technicians.map(tech => tech.id),
        { transaction }
      );
    }));
  }
  
  return recurrences;
};

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, startTime, endTime, Technicians, isRecurring, recurrencePattern, ...otherEventData } = req.body;

    if (!name || !startTime || !endTime) {
      await t.rollback();
      return res.status(400).json({ error: 'Name, start time, and end time are required fields' });
    }

    // Create the original event
    const event = await Event.create({
      name,
      startTime,
      endTime,
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      ...otherEventData
    }, { transaction: t });

    // Associate technicians
    const techs = await Technician.findAll({
      where: { id: Technicians?.map(tech => tech.id) || [] },
      transaction: t
    });
    await event.setTechnicians(techs, { transaction: t });

    // Create recurring events if needed
    if (isRecurring && recurrencePattern) {
      try {
        await createRecurringEvents(event, recurrencePattern, t);
      } catch (error) {
        await t.rollback();
        return res.status(400).json({ error: 'Invalid recurrence rule' });
      }
    }

    await t.commit();

    // Fetch the created event with associations
    const createdEvent = await Event.findByPk(event.id, {
      include: [
        { model: Technician, through: { attributes: [] } },
        { model: Doctor },
        { 
          model: Event,
          as: 'recurrences',
          include: [{ model: Technician, through: { attributes: [] } }]
        }
      ]
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    await t.rollback();
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message || 'An error occurred while creating the event' });
  }
});

// Get events in range
const getEvents = async (start, end) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date range provided');
    }

    return await Event.findAll({
      include: [
        { model: Technician, through: { attributes: [] } },
        { model: Doctor }
      ],
      where: {
        startTime: { [Op.between]: [startDate, endDate] }
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Route handler
const getEventsHandler = async (req, res) => {
  try {
    const { start, end } = req.query;
    const events = await getEvents(start, end);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching events' });
  }
};

// Apply the route handler
router.get('/', authMiddleware, getEventsHandler);

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

// Helper function to handle time updates while preserving dates
// Can we condense this? Why do we make a newDate(origStart) when origStart was already a new date?
const updateEventTimes = (originalEvent, newStartTime, newEndTime) => {
  if (!newStartTime && !newEndTime) return null;

  const origStart = new Date(originalEvent.startTime);
  const origEnd = new Date(originalEvent.endTime);
  const newStart = new Date(newStartTime || originalEvent.startTime);
  const newEnd = new Date(newEndTime || originalEvent.endTime);

  // Keep original dates but update time components
  const updatedStart = new Date(origStart);
  updatedStart.setHours(newStart.getHours(), newStart.getMinutes(), newStart.getSeconds());

  const updatedEnd = new Date(origEnd);
  updatedEnd.setHours(newEnd.getHours(), newEnd.getMinutes(), newEnd.getSeconds());

  return {
    startTime: updatedStart,
    endTime: updatedEnd
  };
};

// Helper function to prepare update data
const prepareUpdateData = (originalEvent, requestBody) => {
  const { startTime, endTime, originalEventId, ...updateData } = requestBody;
  const timeUpdates = updateEventTimes(originalEvent, startTime, endTime);
  
  return {
    ...updateData,
    ...(timeUpdates || {})
  };
};

// Update an event
router.put('/:id', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { updateType = 'single' } = req.query; // 'single' or 'future'
    if (!['single', 'future'].includes(updateType)) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Invalid updateType. Must be either "single" or "future"' 
      });
    }

    let event = await Event.findByPk(req.params.id, {
      include: [
        { model: Technician },
        { model: Doctor }
      ]
    });
    if (!event) {
      await t.rollback();
      return res.status(404).json({ error: 'Event not found' });
    }

    const isAddingRecurrence = 
      !event.isRecurring && 
      req.body.isRecurring && 
      req.body.recurrencePattern;

    // If adding recurrence, create future events regardless of updateType
    if (isAddingRecurrence) {
      // Update the current event first
      await event.update(req.body, { transaction: t });
      
      if (req.body.Technicians) {
        await event.setTechnicians(req.body.Technicians.map(tech => tech.id), { transaction: t });
      }
      
      // Create recurring events
      await createRecurringEvents(event, req.body.recurrencePattern, t);
    } else {
      // Handle different update types
      if (updateType === 'single') {
        // Update only this event
        await event.update(req.body, { transaction: t });
        
        if (req.body.Technicians) {
          await event.setTechnicians(req.body.Technicians.map(tech => tech.id), { transaction: t });
        }
      } else if (updateType === 'future') {
        // Get recurrences
        let recurrences = [];
        const originalEventReference = event.originalEventId || event.id;
        if (originalEventReference) {
          const whereClause = {
            [Op.or]: [
              { id: originalEventReference }, // Include the original event
              { originalEventId: originalEventReference } // Include all recurrences
            ],
            // For 'future' updates, only get events after this one's start time
            startTime: { [Op.gte]: event.startTime }
          };
          recurrences = await Event.findAll({
            where: whereClause,
            include: [
              { model: Technician },
              { model: Doctor }
            ]
          });
        }
        // Attach the recurrences to the event
        event.recurrences = recurrences.filter(rec => rec.id !== event.id);

        // If recurrence pattern is changing, we need to recreate the recurring events
        if (req.body.recurrencePattern && req.body.recurrencePattern !== event.recurrencePattern) {
          // Validate updateType
          if (updateType === 'all') {
            await t.rollback();
            return res.status(400).json({ 
              error: 'Cannot modify past events. Use "future" to modify upcoming events or "single" for individual events.' 
            });
          }

          // Delete this event and relevant recurrences
          await event.destroy({ transaction: t });
          if (event.recurrences) {
            await Promise.all(event.recurrences
              .filter(recurringEvent => 
                recurringEvent.startTime >= event.startTime
              )
              .map(recurringEvent => 
                recurringEvent.destroy({ transaction: t })
              )
            );
          }

          // Create new event with updated pattern
          const { id, ...eventDataWithoutId } = req.body;
          const newEvent = await Event.create({
            ...eventDataWithoutId,
            // For future updates, maintain link to original event
            originalEventId: originalEventReference
          }, { transaction: t });

          // Set technicians for the new event
          if (req.body.Technicians) {
            await newEvent.setTechnicians(
              req.body.Technicians.map(tech => tech.id),
              { transaction: t }
            );
          }

          // Create new recurrences with updated pattern
          await createRecurringEvents(newEvent, req.body.recurrencePattern, t);

          // Update our reference to return the new event
          event = newEvent;
        } else {
          // No pattern change, just regular updates
          // Update this event
          await event.update(req.body, { transaction: t });
          if (req.body.Technicians) {
            await event.setTechnicians(
              req.body.Technicians.map(tech => tech.id),
              { transaction: t }
            );
          }
          // Update recurrences
          if (event.recurrences && event.recurrences.length > 0) {
            await Promise.all(event.recurrences.map(async (recurrence) => {
              const updateData = prepareUpdateData(recurrence, req.body);
              await recurrence.update(updateData, { transaction: t });
              
              if (req.body.Technicians) {
                await recurrence.setTechnicians(
                  req.body.Technicians.map(tech => tech.id),
                  { transaction: t }
                );
              }
            }));
          }
        }
      }
    }

    await t.commit();

    // Reload the event
    await event.reload({
      include: [
        { model: Technician },
        { model: Doctor }
      ]
    });

    res.json(event);
  } catch (error) {
    await t.rollback();
    console.error('Error updating event:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete an event
router.delete('/:id', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { deleteType = 'single' } = req.query; // 'single', 'all', 'future'
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      await t.rollback();
      return res.status(404).json({ error: 'Event not found' });
    }
    const searchId = event.originalEventId || event.id;
    if (deleteType === 'single') {
      await event.destroy({ transaction: t });
    } else if (deleteType === 'all') {
      // Delete original event if it exists
      if (event.originalEventId) {
        await Event.destroy({
          where: { id: event.originalEventId },
          transaction: t
        });
      }
      // Delete all recurrences
      await Event.destroy({
        where: {
          [Op.or]: [
            { id: searchId },
            { originalEventId: searchId }
          ]
        },
        transaction: t
      });
    } else if (deleteType === 'future') {
      // Delete this event and future recurrences
      await Event.destroy({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { id: searchId },
                { originalEventId: searchId }
              ]
            },
            { startTime: { [Op.gte]: event.startTime } }
          ]
        },
        transaction: t
      });
    }

    await t.commit();
    res.status(204).end();
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

module.exports = {router, getEvents};