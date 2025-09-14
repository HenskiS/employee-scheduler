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
      jobNumbers: originalEvent.jobNumbers,
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

// Helper function to check for technician scheduling conflicts
async function checkTechnicianConflicts(eventToUpdate, newTechnicianIds, newStartTime, newEndTime, updateType = 'single') {
  if (!newTechnicianIds || newTechnicianIds.length === 0) {
    return { hasConflicts: false, conflicts: [] };
  }
  if (eventToUpdate.allDay) {
    return { hasConflicts: false, conflicts: [] };
  }

  const conflicts = [];
  
  // Get events to check based on updateType
  let eventsToCheck = [];
  
  if (updateType === 'single') {
    eventsToCheck = [{ 
      id: eventToUpdate.id, 
      startTime: newStartTime, 
      endTime: newEndTime,
      technicianIds: newTechnicianIds 
    }];
  } else if (updateType === 'future') {
    // For future updates, we need to check all future recurring events
    const originalEventReference = eventToUpdate.originalEventId || eventToUpdate.id;
    const futureRecurrences = await Event.findAll({
      where: {
        [Op.or]: [
          { id: originalEventReference },
          { originalEventId: originalEventReference }
        ],
        startTime: { [Op.gte]: eventToUpdate.startTime }
      }
    });
    
    // Calculate time differences for each future event
    eventsToCheck = futureRecurrences.map(recurringEvent => {
      const timeDiff = new Date(recurringEvent.startTime) - new Date(eventToUpdate.startTime);
      return {
        id: recurringEvent.id,
        startTime: new Date(new Date(newStartTime).getTime() + timeDiff),
        endTime: new Date(new Date(newEndTime).getTime() + timeDiff),
        technicianIds: newTechnicianIds
      };
    });
  }

  // Check each event for conflicts
  for (const eventCheck of eventsToCheck) {
    for (const techId of eventCheck.technicianIds) {
      // Find conflicting events for this technician
      const conflictingEvents = await Event.findAll({
        where: {
          id: { [Op.ne]: eventCheck.id }, // Exclude the event being updated
          allDay: false, // Ignore all-day events
          [Op.and]: [
            // Time overlap condition
            {
              startTime: { [Op.lt]: eventCheck.endTime }
            },
            {
              endTime: { [Op.gt]: eventCheck.startTime }
            }
          ]
        },
        include: [
          {
            model: Technician,
            where: { id: techId },
            through: { attributes: [] }
          }
        ]
      });

      if (conflictingEvents.length > 0) {
        // Get technician details
        const technician = await Technician.findByPk(techId);
        
        const existingConflict = conflicts.find(c => c.technicianId === techId);
        if (existingConflict) {
          existingConflict.conflictingEvents.push(...conflictingEvents.map(event => ({
            id: event.id,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            jobNumbers: event.jobNumbers
          })));
        } else {
          conflicts.push({
            technicianId: techId,
            technicianName: technician.name,
            conflictingEvents: conflictingEvents.map(event => ({
              id: event.id,
              name: event.name,
              startTime: event.startTime,
              endTime: event.endTime,
              jobNumbers: event.jobNumbers
            }))
          });
        }
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

// Helper function to check for doctor scheduling conflicts
async function checkDoctorConflicts(eventToUpdate, newDoctorId, newStartTime, newEndTime, updateType = 'single') {
  if (!newDoctorId) {
    return { hasConflicts: false, conflicts: [] };
  }
  if (eventToUpdate.allDay) {
    return { hasConflicts: false, conflicts: [] };
  }

  const conflicts = [];
  
  // Get events to check based on updateType
  let eventsToCheck = [];
  
  if (updateType === 'single') {
    eventsToCheck = [{ 
      id: eventToUpdate.id, 
      startTime: newStartTime, 
      endTime: newEndTime,
      doctorId: newDoctorId 
    }];
  } else if (updateType === 'future') {
    // For future updates, we need to check all future recurring events
    const originalEventReference = eventToUpdate.originalEventId || eventToUpdate.id;
    const futureRecurrences = await Event.findAll({
      where: {
        [Op.or]: [
          { id: originalEventReference },
          { originalEventId: originalEventReference }
        ],
        startTime: { [Op.gte]: eventToUpdate.startTime }
      }
    });
    
    // Calculate time differences for each future event
    eventsToCheck = futureRecurrences.map(recurringEvent => {
      const timeDiff = new Date(recurringEvent.startTime) - new Date(eventToUpdate.startTime);
      return {
        id: recurringEvent.id,
        startTime: new Date(new Date(newStartTime).getTime() + timeDiff),
        endTime: new Date(new Date(newEndTime).getTime() + timeDiff),
        doctorId: newDoctorId
      };
    });
  }

  // Check each event for conflicts
  for (const eventCheck of eventsToCheck) {
    // Find conflicting events for this doctor
    const conflictingEvents = await Event.findAll({
      where: {
        id: { [Op.ne]: eventCheck.id }, // Exclude the event being updated
        allDay: false, // Ignore all-day events
        DoctorId: eventCheck.doctorId, // Same doctor
        [Op.and]: [
          // Time overlap condition
          {
            startTime: { [Op.lt]: eventCheck.endTime }
          },
          {
            endTime: { [Op.gt]: eventCheck.startTime }
          }
        ]
      },
      include: [{ model: Doctor }]
    });

    if (conflictingEvents.length > 0) {
      // Get doctor details
      const doctor = await Doctor.findByPk(eventCheck.doctorId);
      
      conflicts.push({
        doctorId: eventCheck.doctorId,
        doctorName: doctor.name,
        conflictingEvents: conflictingEvents.map(event => ({
          id: event.id,
          name: event.name,
          startTime: event.startTime,
          endTime: event.endTime,
          jobNumbers: event.jobNumbers
        }))
      });
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

// Helper function to check conflicts for new events (including recurring ones)
async function checkNewEventConflicts(startTime, endTime, technicianIds, doctorId, recurrencePattern = null, isAllDay) {
  const technicianConflicts = [];
  const doctorConflicts = [];
  const eventsToCheck = [];

  // Add the main event
  eventsToCheck.push({
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    technicianIds: technicianIds || [],
    doctorId: doctorId
  });

  // If recurring, add all the recurring instances that would be created
  if (recurrencePattern) {
    try {
      // We'll need to simulate the recurring events to check conflicts
      // This assumes createRecurringEvents has a way to preview dates without creating
      // For now, let's create a simple preview function
      const recurringDates = getRecurringEventDates(startTime, endTime, recurrencePattern);
      
      recurringDates.forEach(({ start, end }) => {
        eventsToCheck.push({
          startTime: start,
          endTime: end,
          technicianIds: technicianIds || [],
          doctorId: doctorId
        });
      });
    } catch (error) {
      console.error('Error calculating recurring dates for conflict check:', error);
      // Continue with just the main event check
    }
  }

  // Check technician conflicts if not all-day and technicians exist
  if (!isAllDay && technicianIds && technicianIds.length > 0) {
    for (const eventCheck of eventsToCheck) {
      for (const techId of eventCheck.technicianIds) {
        // Find conflicting events for this technician
        const conflictingEvents = await Event.findAll({
          where: {
            allDay: false, // Ignore all-day events
            [Op.and]: [
              // Time overlap condition
              {
                startTime: { [Op.lt]: eventCheck.endTime }
              },
              {
                endTime: { [Op.gt]: eventCheck.startTime }
              }
            ]
          },
          include: [
            {
              model: Technician,
              where: { id: techId },
              through: { attributes: [] }
            }
          ]
        });

        if (conflictingEvents.length > 0) {
          // Get technician details
          const technician = await Technician.findByPk(techId);
          
          const existingConflict = technicianConflicts.find(c => c.technicianId === techId);
          const conflictEventData = conflictingEvents.map(event => ({
            id: event.id,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            jobNumbers: event.jobNumbers
          }));

          if (existingConflict) {
            existingConflict.conflictingEvents.push(...conflictEventData);
          } else {
            technicianConflicts.push({
              technicianId: techId,
              technicianName: technician.name,
              conflictingEvents: conflictEventData
            });
          }
        }
      }
    }
  }

  // Check doctor conflicts if not all-day and doctor exists
  if (!isAllDay && doctorId) {
    for (const eventCheck of eventsToCheck) {
      // Find conflicting events for this doctor
      const conflictingEvents = await Event.findAll({
        where: {
          allDay: false, // Ignore all-day events
          DoctorId: eventCheck.doctorId, // Same doctor
          [Op.and]: [
            // Time overlap condition
            {
              startTime: { [Op.lt]: eventCheck.endTime }
            },
            {
              endTime: { [Op.gt]: eventCheck.startTime }
            }
          ]
        },
        include: [{ model: Doctor }]
      });

      if (conflictingEvents.length > 0) {
        // Get doctor details
        const doctor = await Doctor.findByPk(eventCheck.doctorId);
        
        doctorConflicts.push({
          doctorId: eventCheck.doctorId,
          doctorName: doctor.name,
          conflictingEvents: conflictingEvents.map(event => ({
            id: event.id,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            jobNumbers: event.jobNumbers
          }))
        });
      }
    }
  }

  const hasConflicts = technicianConflicts.length > 0 || doctorConflicts.length > 0;
  
  return {
    hasConflicts,
    technicianConflicts,
    doctorConflicts
  };
}

// Simple function to get recurring event dates (you may need to adjust based on your createRecurringEvents implementation)
function getRecurringEventDates(startTime, endTime, recurrencePattern, limit = 100) {
  const dates = [];
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = end.getTime() - start.getTime();
  
  // This is a simplified implementation - you'll want to match your actual recurrence logic
  // For now, assuming weekly recurrence as an example
  if (recurrencePattern.includes('WEEKLY')) {
    let currentStart = new Date(start);
    for (let i = 1; i < limit; i++) {
      currentStart.setDate(currentStart.getDate() + 7);
      if (currentStart.getFullYear() > start.getFullYear() + 2) break; // Don't go beyond 2 years
      
      dates.push({
        start: new Date(currentStart),
        end: new Date(currentStart.getTime() + duration)
      });
    }
  }
  
  return dates;
}

// Create a new event
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { force = 'false' } = req.query;
    const isForceCreate = force === 'true';
    const { name, startTime, endTime, Technicians, DoctorId, isRecurring, recurrencePattern, ...otherEventData } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: 'Name, start time, and end time are required fields' });
    }

    // Check for conflicts before creating
    if (!isForceCreate && ((Technicians && Technicians.length > 0) || DoctorId)) {
      const technicianIds = Technicians ? Technicians.map(tech => tech.id) : [];
      
      const conflictCheck = await checkNewEventConflicts(
        startTime,
        endTime,
        technicianIds,
        DoctorId,
        isRecurring ? recurrencePattern : null,
        req.body.allDay
      );
      
      if (conflictCheck.hasConflicts) {
        return res.status(409).json({
          error: 'Scheduling conflicts detected',
          ...conflictCheck
        });
      }
    }

    // Log force creates for audit purposes
    if (isForceCreate && ((Technicians && Technicians.length > 0) || DoctorId)) {
      console.log(`[AUDIT] Force create applied for new event by user ${req.user?.id || 'unknown'}`, {
        eventName: name,
        startTime,
        endTime,
        isRecurring,
        technicians: Technicians ? Technicians.map(t => ({ id: t.id, name: t.name })) : [],
        doctorId: DoctorId,
        timestamp: new Date().toISOString(),
        userId: req.user?.id
      });
    }

    const t = await sequelize.transaction();
    try {
      // Create the original event
      const event = await Event.create({
        name,
        startTime,
        endTime,
        DoctorId,
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
      throw error;
    }
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message || 'An error occurred while creating the event' });
  }
});

// Get events in range with optional filtering
const getEvents = async (start, end, filters = {}) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date range provided');
    }

    // Base query with date range
    const whereClause = {
      startTime: { [Op.between]: [startDate, endDate] }
    };

    // Add label filtering if provided
    if (filters.labels && filters.labels.length > 0) {
      whereClause.label = { [Op.in]: filters.labels };
    }

    // Add doctor filtering if provided
    if (filters.doctors && filters.doctors.length > 0) {
      whereClause.DoctorId = { [Op.in]: filters.doctors };
    }

    // Build include array for associations
    const includeArray = [
      { model: Doctor }
    ];

    // Add technician filtering if provided
    if (filters.technicians && filters.technicians.length > 0) {
      includeArray.push({
        model: Technician,
        through: { attributes: [] },
        where: { id: { [Op.in]: filters.technicians } }
      });
    } else {
      includeArray.push({
        model: Technician,
        through: { attributes: [] }
      });
    }

    return await Event.findAll({
      include: includeArray,
      where: whereClause
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Route handler
const getEventsHandler = async (req, res) => {
  try {
    const { start, end, labels, doctors, technicians } = req.query;

    // Parse filter parameters
    const filters = {};

    if (labels) {
      filters.labels = Array.isArray(labels) ? labels : labels.split(',');
    }

    if (doctors) {
      filters.doctors = Array.isArray(doctors) ? doctors.map(Number) : doctors.split(',').map(Number);
    }

    if (technicians) {
      filters.technicians = Array.isArray(technicians) ? technicians.map(Number) : technicians.split(',').map(Number);
    }

    const events = await getEvents(start, end, filters);
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
  try {
    const { updateType = 'single', force = 'false' } = req.query;
    const isForceUpdate = force === 'true';
    
    if (!['single', 'future'].includes(updateType)) {
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
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check for conflicts before making any changes
    if (!isForceUpdate && (req.body.Technicians || req.body.DoctorId)) {
      const technicianIds = req.body.Technicians ? req.body.Technicians.map(tech => tech.id) : null;
      const doctorId = req.body.DoctorId || null;
      const newStartTime = req.body.startTime || event.startTime;
      const newEndTime = req.body.endTime || event.endTime;
      
      let technicianConflictCheck = { hasConflicts: false, conflicts: [] };
      let doctorConflictCheck = { hasConflicts: false, conflicts: [] };

      // Check technician conflicts if technicians are being updated
      if (technicianIds) {
        technicianConflictCheck = await checkTechnicianConflicts(
          event, 
          technicianIds, 
          newStartTime, 
          newEndTime, 
          updateType
        );
      }

      // Check doctor conflicts if doctor is being updated
      if (doctorId) {
        doctorConflictCheck = await checkDoctorConflicts(
          event, 
          doctorId, 
          newStartTime, 
          newEndTime, 
          updateType
        );
      }
      
      if (technicianConflictCheck.hasConflicts || doctorConflictCheck.hasConflicts) {
        return res.status(409).json({
          error: 'Scheduling conflicts detected',
          hasConflicts: true,
          technicianConflicts: technicianConflictCheck.conflicts,
          doctorConflicts: doctorConflictCheck.conflicts
        });
      }
    }

    // Log force updates for audit purposes
    if (isForceUpdate && (req.body.Technicians || req.body.DoctorId)) {
      console.log(`[AUDIT] Force update applied for event ${event.id} by user ${req.user?.id || 'unknown'}`, {
        eventId: event.id,
        eventName: event.name,
        updateType,
        newTechnicians: req.body.Technicians ? req.body.Technicians.map(t => ({ id: t.id, name: t.name })) : [],
        newDoctorId: req.body.DoctorId,
        timestamp: new Date().toISOString(),
        userId: req.user?.id
      });
    }

    // Start transaction for database changes
    const t = await sequelize.transaction();
    
    try {
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
      throw error;
    }
  } catch (error) {
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