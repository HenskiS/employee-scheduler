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
      originalEventId: originalEvent.id,
      DoctorId: originalEvent.DoctorId,
      recurrencePattern: rule,
      createdBy: originalEvent.createdBy
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
    const { name, startTime, endTime, Technicians, isRecurring, rule, ...otherEventData } = req.body;

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
      recurrencePattern: isRecurring ? rule : null,
      ...otherEventData
    }, { transaction: t });

    // Associate technicians
    const techs = await Technician.findAll({
      where: { id: Technicians?.map(tech => tech.id) || [] },
      transaction: t
    });
    await event.setTechnicians(techs, { transaction: t });

    // Create recurring events if needed
    if (isRecurring && rule) {
      try {
        await createRecurringEvents(event, rule, t);
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
const fetchEvents = async (startDate, endDate) => {
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date range provided');
  }

  return await Event.findAll({
    include: [
      { model: Technician, through: { attributes: [] } },
      { model: Doctor },
      { 
        model: Event,
        as: 'originalEvent',
        include: [{ model: Technician }]
      }
    ],

    where: {
      startTime: { [Op.between]: [startDate, endDate] }
    }
  });
};

// Function to be used by other modules (like refresh.js)
const getEvents = async (start, end) => {
  const startDate = new Date(start);
  // Add one day to end date to include the full end date
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() + 1);

  return await fetchEvents(startDate, endDate);
};

// Route handler
const getEventsHandler = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);

    const expandedEvents = await fetchEvents(startDate, endDate);
    res.json(expandedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
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
  const { startTime, endTime, ...updateData } = requestBody;
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
    const { updateType = 'single' } = req.query; // 'single', 'all', 'future'
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Technician },
        { model: Doctor },
        { 
          model: Event,
          as: 'recurrences',
          where: updateType === 'future' ? {
            startTime: { [Op.gte]: new Date(req.body.startTime || new Date()) }
          } : undefined,
          required: false
        }
      ]
    });

    if (!event) {
      await t.rollback();
      return res.status(404).json({ error: 'Event not found' });
    }

    // Handle different update types
    if (updateType === 'single') {
      // Update only this event
      await event.update(req.body, { transaction: t });
      
      if (req.body.Technicians) {
        await event.setTechnicians(req.body.Technicians.map(tech => tech.id), { transaction: t });
      }
    } else if (updateType === 'all' || updateType === 'future') {
      // If recurrence pattern is changing, we need to recreate the recurring events
      if (req.body.recurrencePattern && req.body.recurrencePattern !== event.recurrencePattern) {
        // Delete existing recurrences that we're updating
        await Event.destroy({
          where: {
            [Op.and]: [
              { 
                [Op.or]: [
                  { id: event.id },
                  { originalEventId: event.id },
                  { originalEventId: event.originalEventId }
                ]
              },
              updateType === 'future' 
                ? { startTime: { [Op.gte]: event.startTime } }
                : {}
            ]
          },
          transaction: t
        });

        // Create new event with updated pattern
        const newEvent = await Event.create({
          ...req.body,
          originalEventId: null // This will be the new original event
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
        // Update original event if it exists and we're updating all
        if (updateType === 'all' && event.originalEventId) {
          const originalEvent = await Event.findByPk(event.originalEventId);
          if (originalEvent) {
            const updateData = prepareUpdateData(originalEvent, req.body);
            await originalEvent.update(updateData, { transaction: t });
            
            if (req.body.Technicians) {
              await originalEvent.setTechnicians(
                req.body.Technicians.map(tech => tech.id),
                { transaction: t }
              );
            }
          }
        }

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
    const event = await Event.findByPk(req.params.id, {
      include: [{
        model: Event,
        as: 'recurrences',
        where: deleteType === 'future' ? {
          startTime: { [Op.gte]: new Date() }
        } : undefined,
        required: false
      }]
    });

    if (!event) {
      await t.rollback();
      return res.status(404).json({ error: 'Event not found' });
    }

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
            { id: event.id },
            { originalEventId: event.id },
            { originalEventId: event.originalEventId }
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
                { id: event.id },
                { originalEventId: event.id },
                { originalEventId: event.originalEventId }
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
