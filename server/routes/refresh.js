const express = require('express');
const router = express.Router();

// Import your existing service functions
const { getDoctors } = require('./doctors');
const { getTechnicians } = require('./technicians');
const { getUsers } = require('./users');
const { getEvents } = require('./events');
const authMiddleware = require('../middleware/auth');

/**
 * Combined refresh endpoint that returns all necessary data
 * GET /api/refresh?start=ISO_DATE&end=ISO_DATE
 */
router.get('/', authMiddleware, async (req, res) => {
  const { start, end } = req.query;

  // Validate date parameters
  if (!start || !end) {
    return res.status(400).json({ 
      error: 'Missing required date parameters: start and end' 
    });
  }

  try {
    // Fetch all data concurrently
    const [doctors, technicians, users, events] = await Promise.all([
      getDoctors(),
      getTechnicians(),
      getUsers(req.user.isAdmin, req.user.id),
      getEvents(start, end)
    ]);
    // Return combined response
    res.json({
      timestamp: new Date().toISOString(),
      data: {
        doctors,
        technicians,
        users,
        events
      }
    });
  } catch (error) {
    console.error('Refresh endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;