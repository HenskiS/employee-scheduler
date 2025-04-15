const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Event, Technician, Doctor } = require('../models/index');
const authMiddleware = require('../middleware/auth');
const { generatePDF } = require('../utils/generatePDF');
const { sendSchedulePdf } = require('../utils/emailHandler');

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

// Send schedule emails to multiple technicians
router.post('/send-emails', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, technicians, emailSubject, emailMessage, includeAllEvents } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    
    if (!technicians || !Array.isArray(technicians) || technicians.length === 0) {
      return res.status(400).json({ error: 'At least one technician must be selected' });
    }

    const results = [];
    const errors = [];

    // Process each technician
    for (const tech of technicians) {
      try {
        // Get technician details from database if we only have the ID
        let technicianName, technicianEmail;
        
        if (typeof tech === 'object' && tech.id) {
          technicianName = tech.name || 'Technician';
          technicianEmail = tech.email;
        } else {
          // Fetch technician data from the database
          const technicianData = await Technician.findByPk(tech);
          if (!technicianData) {
            throw new Error(`Technician with ID ${tech} not found`);
          }
          technicianName = technicianData.name || 'Technician';
          technicianEmail = technicianData.email;
        }
        
        if (!technicianEmail) {
          throw new Error(`No email found for technician ${technicianName}`);
        }

        // Generate the print URL
        const printUrl = `http://localhost:${process.env.PORT}/print?technicianId=${typeof tech === 'object' ? tech.id : tech}&start=${startDate}&end=${endDate}&all=${includeAllEvents}`;
        
        // Generate PDF
        const pdfBuffer = await generatePDF(printUrl);
        
        // Send email with PDF
        const emailResult = await sendSchedulePdf(
          technicianEmail,
          pdfBuffer,
          technicianName,
          emailSubject || 'Your Schedule',
          emailMessage || null
        );
        
        results.push({
          technicianId: typeof tech === 'object' ? tech.id : tech,
          technicianName,
          emailSent: emailResult.success,
          messageId: emailResult.messageId
        });
        
      } catch (error) {
        console.error(`Error processing technician ${typeof tech === 'object' ? tech.id : tech}:`, error);
        errors.push({
          technicianId: typeof tech === 'object' ? tech.id : tech,
          error: error.message
        });
      }
    }
    
    // Return results
    res.json({
      success: errors.length === 0,
      results,
      errors,
      totalProcessed: technicians.length,
      successful: results.length,
      failed: errors.length
    });
    
  } catch (error) {
    console.error('Error in send-emails route:', error);
    res.status(500).json({ error: error.message || 'An error occurred while sending schedule emails' });
  }
});

module.exports = { router };