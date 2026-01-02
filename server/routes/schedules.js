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
          emailResult.success ? resultInfo : { error: emailResult.error, technicianName }
        );
        
      } catch (error) {
        console.error(`Error processing technician ${techId}:`, error);
        const errorInfo = {
          technicianId: techId,
          error: error.message
        };
        errors.push(errorInfo);
        
        // Update technician status to "failed" with technician name
        const technicianName = typeof tech === 'object' ? tech.name : 
            (await Technician.findByPk(tech))?.name || `Technician ${techId}`;
        updateTechnicianStatus(responseId, techId, 'failed', { ...errorInfo, technicianName });
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

    // Normalize field names for backward compatibility
    const normalizedStatus = {
      ...status,
      totalRecipients: status.totalRecipients || status.totalTechnicians || 0,
      recipientStatus: status.recipientStatus || status.technicianStatus || []
    };

    res.json(normalizedStatus);

    // Clean up completed statuses after 1 hour
    if (status.completed && (new Date() - status.lastUpdated > 60 * 60 * 1000)) {
      global.emailStatus.delete(id);
    }
  } catch (error) {
    console.error('Error fetching email status:', error);
    res.status(500).json({ error: error.message || 'An error occurred while checking email status' });
  }
});

// Send print preview emails to multiple recipients
router.post('/send-print-emails', authMiddleware, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      view,
      labels,
      doctors,
      technicians,
      tags,
      displayOptions,
      customHeader,
      splitByMonth,
      recipients,
      emailSubject,
      emailMessage
    } = req.body;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    if (!recipients ||
        (!recipients.doctors?.length &&
         !recipients.technicians?.length &&
         !recipients.users?.length &&
         !recipients.customEmails?.length)) {
      return res.status(400).json({ error: 'At least one recipient must be selected' });
    }

    // Flatten all recipients into a single array for processing
    const allRecipients = [];

    // Process doctor recipients (with selected emails)
    if (recipients.doctors && recipients.doctors.length > 0) {
      for (const doctor of recipients.doctors) {
        for (const emailObj of doctor.selectedEmails) {
          allRecipients.push({
            type: 'doctor',
            id: doctor.id,
            name: doctor.customer,
            email: emailObj.email,
            emailLabel: emailObj.label || emailObj.type
          });
        }
      }
    }

    // Process technician recipients
    if (recipients.technicians && recipients.technicians.length > 0) {
      for (const tech of recipients.technicians) {
        allRecipients.push({
          type: 'technician',
          id: tech.id,
          name: tech.name,
          email: tech.email
        });
      }
    }

    // Process user recipients
    if (recipients.users && recipients.users.length > 0) {
      for (const user of recipients.users) {
        allRecipients.push({
          type: 'user',
          id: user.id,
          name: user.name,
          email: user.email
        });
      }
    }

    // Process custom emails
    if (recipients.customEmails && recipients.customEmails.length > 0) {
      for (const customEmail of recipients.customEmails) {
        allRecipients.push({
          type: 'custom',
          email: customEmail,
          name: 'Recipient'
        });
      }
    }

    // Send initial response for progress tracking
    const responseId = Date.now().toString();
    res.status(202).json({
      id: responseId,
      message: 'Email sending process started',
      totalRecipients: allRecipients.length,
      status: 'processing'
    });

    // Initialize status tracking
    global.emailStatus = global.emailStatus || new Map();
    global.emailStatus.set(responseId, {
      totalRecipients: allRecipients.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      inProgress: allRecipients.length,
      recipientStatus: allRecipients.map(recipient => ({
        recipientId: recipient.id || recipient.email,
        recipientName: recipient.name,
        email: recipient.email,
        status: 'pending',
        details: null
      })),
      startTime: new Date(),
      lastUpdated: new Date()
    });

    // Build PDF generation parameters
    const pdfParams = {
      startDate,
      endDate,
      view: view || 'agenda',
      labels,
      doctors,
      technicians,
      tags,
      displayOptions,
      customHeader,
      splitByMonth
    };

    // Generate PDF once (reuse for all recipients)
    let pdfBuffer;
    try {
      const { generatePrintPreviewPDF } = require('../utils/generatePDF');
      pdfBuffer = await generatePrintPreviewPDF(pdfParams);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Update all recipient statuses to failed
      const statusRecord = global.emailStatus.get(responseId);
      statusRecord.recipientStatus.forEach(r => {
        r.status = 'failed';
        r.details = { error: 'PDF generation failed' };
      });
      statusRecord.failed = allRecipients.length;
      statusRecord.inProgress = 0;
      statusRecord.processed = allRecipients.length;
      statusRecord.completed = true;
      global.emailStatus.set(responseId, statusRecord);
      return;
    }

    // Send emails to all recipients
    const { sendSchedulePdf, validateEmail } = require('../utils/emailHandler');

    for (const recipient of allRecipients) {
      // Update status to processing
      updateRecipientStatus(responseId, recipient.email, 'processing');

      try {
        // Validate email
        if (!validateEmail(recipient.email)) {
          throw new Error(`Invalid email address: ${recipient.email}`);
        }

        // Send email
        const emailResult = await sendSchedulePdf(
          recipient.email,
          pdfBuffer,
          recipient.name,
          emailSubject || 'Schedule',
          emailMessage || null
        );

        // Update status
        updateRecipientStatus(
          responseId,
          recipient.email,
          emailResult.success ? 'completed' : 'failed',
          emailResult.success
            ? { messageId: emailResult.messageId }
            : { error: emailResult.error }
        );

      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        updateRecipientStatus(
          responseId,
          recipient.email,
          'failed',
          { error: error.message }
        );
      }
    }

    // Mark as completed
    const finalStatus = global.emailStatus.get(responseId);
    finalStatus.completed = true;
    finalStatus.lastUpdated = new Date();
    global.emailStatus.set(responseId, finalStatus);

  } catch (error) {
    console.error('Error in send-print-emails route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function for recipient status updates
function updateRecipientStatus(responseId, email, status, details = null) {
  const statusRecord = global.emailStatus.get(responseId);
  if (!statusRecord) return;

  const recipientIndex = statusRecord.recipientStatus.findIndex(r => r.email === email);
  if (recipientIndex === -1) return;

  statusRecord.recipientStatus[recipientIndex].status = status;
  statusRecord.recipientStatus[recipientIndex].details = details;

  if (status === 'completed') {
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

// Get events for print view (localhost-only, no auth required)
router.get('/events-print', async (req, res) => {
  // Verify localhost access only
  const clientIp = req.ip || req.socket.remoteAddress;
  if (!(clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.includes('::ffff:127.0.0.1'))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { start, end, labels, doctors, technicians } = req.query;
    console.log('events-print endpoint called with params:', { start, end, labels, doctors, technicians });

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // Parse filter parameters (same as events route)
    const filters = {};

    if (labels) {
      filters.labels = Array.isArray(labels) ? labels : labels.split(',');
    }

    if (doctors) {
      filters.doctors = Array.isArray(doctors)
        ? doctors.map(Number)
        : doctors.split(',').map(Number);
    }

    if (technicians) {
      filters.technicians = Array.isArray(technicians)
        ? technicians.map(Number)
        : technicians.split(',').map(Number);
    }

    console.log('Parsed filters:', filters);

    // Reuse getEvents helper from events route
    const { getEvents } = require('./events');
    const events = await getEvents(start, end, filters);
    console.log(`Fetched ${events.length} events for print`);
    res.json(events);
  } catch (error) {
    console.error('Error in events-print route:', error);
    res.status(500).json({ error: error.message || 'An error occurred' });
  }
});

module.exports = { router };