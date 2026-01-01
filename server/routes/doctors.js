const express = require('express');
const router = express.Router();
const { Doctor, DoctorEmail, Tag } = require('../models');
const authMiddleware = require('../middleware/auth');

// Create a new doctor
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tags, ...doctorData } = req.body;
    const doctor = await Doctor.create(doctorData);

    // Handle tags if provided
    if (tags && tags.length > 0) {
      await doctor.setTags(tags.map(tag => tag.id));
    }

    // Return doctor with tags
    const doctorWithTags = await Doctor.findByPk(doctor.id, {
      include: [
        {
          model: DoctorEmail,
          as: 'emails'
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json(doctorWithTags);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all doctors
const getDoctors = async () => {
  const doctors = await Doctor.findAll({
    include: [
      {
        model: DoctorEmail,
        as: 'emails'
      },
      {
        model: Tag,
        as: 'tags',
        through: { attributes: [] }
      }
    ]
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
      include: [
        {
          model: DoctorEmail,
          as: 'emails'
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
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

    const { emails, tags, ...doctorData } = req.body;

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

    // Handle tags if provided
    if (tags !== undefined) {
      await doctor.setTags(tags.map(tag => tag.id));
    }

    // Return updated doctor with emails and tags
    const updatedDoctor = await Doctor.findByPk(req.params.id, {
      include: [
        {
          model: DoctorEmail,
          as: 'emails'
        },
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
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

// Export doctors to CSV
const { Parser } = require('json2csv');

router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    let doctors = await getDoctors();

    // Filter by tags if provided
    const { tags } = req.query;
    if (tags) {
      const tagIds = tags.split(',').map(id => parseInt(id, 10));
      doctors = doctors.filter(doctor =>
        doctor.tags && doctor.tags.some(tag => tagIds.includes(tag.id))
      );
    }

    // Transform data for CSV export
    const csvData = doctors.map(doctor => {
      const plain = doctor.toJSON();

      // Format emails as semicolon-separated list
      const emailList = plain.emails?.length > 0
        ? plain.emails.map(e => {
            const parts = [e.email];
            if (e.type) parts.push(`(${e.type})`);
            if (e.label) parts.push(`[${e.label}]`);
            if (e.isPrimary) parts.push('*PRIMARY*');
            return parts.join(' ');
          }).join('; ')
        : '';

      // Format tags as comma-separated list
      const tagList = plain.tags?.length > 0
        ? plain.tags.map(t => t.name).join(', ')
        : '';

      return {
        'ID': plain.id,
        'Customer': plain.customer || '',
        'Practice Name': plain.practiceName || '',
        'Physical Address': plain.physicalAddress || '',
        'City': plain.city || '',
        'State': plain.state || '',
        'Zip': plain.zip || '',
        'Scheduling Contact 1': plain.schedulingContact1 || '',
        'Scheduling Phone 1': plain.schedulingPhone1 || '',
        'Scheduling Contact 2': plain.schedulingContact2 || '',
        'Scheduling Phone 2': plain.schedulingPhone2 || '',
        'Contact Emails': emailList,
        'Bill To': plain.billTo || '',
        'Billing Address': plain.billingAddress || '',
        'Billing City': plain.billingCity || '',
        'Billing State': plain.billingState || '',
        'Billing Zip': plain.billingZip || '',
        'Billing Contact': plain.billingContact || '',
        'Main Phone': plain.mainPhone || '',
        'Fax': plain.fax || '',
        'Notes': plain.notes || '',
        'Tags': tagList
      };
    });

    // Define CSV fields
    const fields = [
      'ID', 'Customer', 'Practice Name', 'Physical Address', 'City', 'State', 'Zip',
      'Scheduling Contact 1', 'Scheduling Phone 1', 'Scheduling Contact 2',
      'Scheduling Phone 2', 'Contact Emails', 'Bill To', 'Billing Address',
      'Billing City', 'Billing State', 'Billing Zip', 'Billing Contact',
      'Main Phone', 'Fax', 'Notes', 'Tags'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',
      `attachment; filename="doctors-export-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csv);
  } catch (error) {
    console.error('Error exporting doctors to CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {router, getDoctors};