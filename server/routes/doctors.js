const express = require('express');
const router = express.Router();
const { Doctor, DoctorEmail } = require('../models');
const authMiddleware = require('../middleware/auth');

// Create a new doctor
router.post('/', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all doctors
const getDoctors = async () => {
  const doctors = await Doctor.findAll({
    include: [{
      model: DoctorEmail,
      as: 'emails'
    }]
  });
  return doctors;
};
const getDoctorsHandler = async (req, res) => {
  try {
    const doctors = await getDoctors();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
router.get('/', authMiddleware, getDoctorsHandler);

// Get a specific doctor
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [{
        model: DoctorEmail,
        as: 'emails'
      }]
    });
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a doctor
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [{
        model: DoctorEmail,
        as: 'emails'
      }]
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const { emails, ...doctorData } = req.body;

    // Update doctor basic info
    await doctor.update(doctorData);

    // Handle emails if provided
    if (emails) {
      const existingEmails = doctor.emails || [];
      const incomingEmails = emails;

      // Update or create emails
      for (const emailData of incomingEmails) {
        if (emailData.id) {
          // Update existing email
          const existingEmail = existingEmails.find(e => e.id === emailData.id);
          if (existingEmail) {
            await existingEmail.update(emailData);
          }
        } else {
          // Create new email
          await DoctorEmail.create({
            ...emailData,
            DoctorId: req.params.id
          });
        }
      }

      // Delete emails that are no longer in the request
      const incomingEmailIds = incomingEmails.filter(e => e.id).map(e => e.id);
      const emailsToDelete = existingEmails.filter(e => !incomingEmailIds.includes(e.id));

      for (const emailToDelete of emailsToDelete) {
        await emailToDelete.destroy();
      }
    }

    // Return updated doctor with emails
    const updatedDoctor = await Doctor.findByPk(req.params.id, {
      include: [{
        model: DoctorEmail,
        as: 'emails'
      }]
    });

    res.json(updatedDoctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a doctor
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);
    if (doctor) {
      await doctor.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {router, getDoctors};