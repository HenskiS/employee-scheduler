const express = require('express');
const router = express.Router();
const { EventCompletion, Event } = require('../models/index');
const authMiddleware = require('../middleware/auth');

// Get completion data for a specific event
router.get('/:eventId', authMiddleware, async (req, res) => {
  try {
    const completion = await EventCompletion.findOne({
      where: { EventId: req.params.eventId },
      include: [{ model: Event }]
    });

    if (!completion) {
      return res.status(404).json({ error: 'Completion data not found for this event' });
    }

    res.json(completion);
  } catch (error) {
    console.error('Error fetching event completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update completion data for an event
router.put('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { confirmed, confirmedAt, jobNotes, clockInTime, clockOutTime, numberOfCases } = req.body;

    // Verify the event exists
    const event = await Event.findByPk(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if completion data already exists
    let completion = await EventCompletion.findOne({
      where: { EventId: req.params.eventId }
    });

    if (completion) {
      // Update existing completion data
      await completion.update({
        confirmed,
        confirmedAt,
        jobNotes,
        clockInTime,
        clockOutTime,
        numberOfCases
      });
    } else {
      // Create new completion data
      completion = await EventCompletion.create({
        EventId: req.params.eventId,
        confirmed,
        confirmedAt,
        jobNotes,
        clockInTime,
        clockOutTime,
        numberOfCases
      });
    }

    res.json(completion);
  } catch (error) {
    console.error('Error saving event completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete completion data for an event
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const completion = await EventCompletion.findOne({
      where: { EventId: req.params.eventId }
    });

    if (!completion) {
      return res.status(404).json({ error: 'Completion data not found for this event' });
    }

    await completion.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting event completion:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
