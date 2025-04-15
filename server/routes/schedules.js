const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Event, Technician, Doctor } = require('../models/index');
const authMiddleware = require('../middleware/auth');

// Get events for a specific technician within a date range
const getTechnicianEvents = async (technicianId, start, end, includeForAll = false) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setDate(endDate.getDate() + 1);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date range provided');
    }

    // Build the where clause
    const whereClause = {
      startTime: { [Op.between]: [startDate, endDate] }
    };

    // Include events with forAll = true if requested
    if (!includeForAll) {
      whereClause.forAll = false;
    }

    // Find events where the technician is assigned
    return await Event.findAll({
      include: [
        { 
          model: Technician,
          where: { id: technicianId },
          through: { attributes: [] }
        },
        { model: Doctor }
      ],
      where: whereClause
    });
  } catch (error) {
    console.error('Error fetching technician events:', error);
    throw error;
  }
};

// Route handler for technician events
router.get('/events', async (req, res) => {
  try {
    const { technicianId, start, end, all } = req.query;
    
    if (!technicianId) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    // Convert 'all' string parameter to boolean
    const includeForAll = all === 'true';
    
    const events = await getTechnicianEvents(technicianId, start, end, includeForAll);
    res.json(events);
  } catch (error) {
    console.error('Error in schedule route:', error);
    res.status(500).json({ error: error.message || 'An error occurred while fetching the schedule' });
  }
});


module.exports = { router };