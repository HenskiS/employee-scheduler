const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Event, Technician, Doctor } = require('../models/index');
const authMiddleware = require('../middleware/auth');
const { generatePDF } = require('../utils/generatePDF');
const { sendSchedulePdf, validateEmail } = require('../utils/emailHandler');

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

    // Set up arrays to track status
    const results = [];
    const errors = [];
    
    // Send initial response to allow tracking progress
    const responseId = Date.now().toString();
    res.status(202).json({
      id: responseId,
      message: 'Email sending process started',
      totalTechnicians: technicians.length,
      status: 'processing'
    });

    // Create a record in the global map to track this batch of emails
    global.emailStatus = global.emailStatus || new Map();
    global.emailStatus.set(responseId, {
      totalTechnicians: technicians.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      inProgress: technicians.length,
      technicianStatus: technicians.map(tech => {
        const techId = typeof tech === 'object' ? tech.id : tech;
        return {
          technicianId: techId,
          status: 'pending',
          details: null
        };
      }),
      startTime: new Date(),
      lastUpdated: new Date()
    });

    // Process each technician
    for (const tech of technicians) {
      const techId = typeof tech === 'object' ? tech.id : tech;
      
      // Update technician status to "processing"
      updateTechnicianStatus(responseId, techId, 'processing');
      
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

        // Validate email before proceeding
        if (!validateEmail(technicianEmail)) {
          throw new Error(`Invalid email address for technician ${technicianName}: ${technicianEmail}`);
        }

        // Generate the print URL
        const printUrl = `http://localhost:${process.env.PORT}/print?technicianId=${techId}&start=${startDate}&end=${endDate}&all=${includeAllEvents}`;
        
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
        
        const resultInfo = {
          technicianId: techId,
          technicianName,
          emailSent: emailResult.success,
          messageId: emailResult.messageId
        };
        
        results.push(resultInfo);
        
        // Update technician status to "completed" or "failed"
        updateTechnicianStatus(
          responseId, 
          techId, 
          emailResult.success ? 'completed' : 'failed',
          emailResult.success ? resultInfo : { error: emailResult.error }
        );
        
      } catch (error) {
        console.error(`Error processing technician ${techId}:`, error);
        const errorInfo = {
          technicianId: techId,
          error: error.message
        };
        errors.push(errorInfo);
        
        // Update technician status to "failed"
        updateTechnicianStatus(responseId, techId, 'failed', errorInfo);
      }
    }
    
    // Update final status
    const finalStatus = global.emailStatus.get(responseId);
    finalStatus.completed = true;
    finalStatus.lastUpdated = new Date();
    global.emailStatus.set(responseId, finalStatus);
    
    // We've already sent the initial response, so we don't return anything here
  } catch (error) {
    console.error('Error in send-emails route:', error);
    res.status(500).json({ error: error.message || 'An error occurred while sending schedule emails' });
  }
});

// Helper function to update technician status in the emailStatus map
function updateTechnicianStatus(responseId, technicianId, status, details = null) {
  const statusRecord = global.emailStatus.get(responseId);
  if (!statusRecord) return;
  
  const techIndex = statusRecord.technicianStatus.findIndex(t => t.technicianId === technicianId);
  if (techIndex === -1) return;
  
  // Update the technician's status
  statusRecord.technicianStatus[techIndex] = {
    technicianId,
    status,
    details
  };
  
  // Update counters based on status
  if (status === 'processing') {
    // No counter changes needed, already set to "inProgress" initially
  } else if (status === 'completed') {
    statusRecord.succeeded++;
    statusRecord.inProgress--;
    statusRecord.processed++;
  } else if (status === 'failed') {
    statusRecord.failed++;
    statusRecord.inProgress--;
    statusRecord.processed++;
  }
  
  statusRecord.lastUpdated = new Date();
  global.emailStatus.set(responseId, statusRecord);
}

// Route to check email sending status
router.get('/email-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!global.emailStatus || !global.emailStatus.has(id)) {
      return res.status(404).json({ error: 'Status ID not found' });
    }
    
    const status = global.emailStatus.get(id);
    res.json(status);
    
    // Clean up completed statuses after 1 hour
    if (status.completed && (new Date() - status.lastUpdated > 60 * 60 * 1000)) {
      global.emailStatus.delete(id);
    }
  } catch (error) {
    console.error('Error fetching email status:', error);
    res.status(500).json({ error: error.message || 'An error occurred while checking email status' });
  }
});

module.exports = { router };