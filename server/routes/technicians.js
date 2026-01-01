const express = require('express');
const router = express.Router();
const { Technician, Tag } = require('../models');
const authMiddleware = require('../middleware/auth');

// Create a new technician
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tags, ...techData } = req.body;
    const technician = await Technician.create(techData);

    // Handle tags if provided
    if (tags && tags.length > 0) {
      await technician.setTags(tags.map(tag => tag.id));
    }

    // Return technician with tags
    const techWithTags = await Technician.findByPk(technician.id, {
      include: [
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json(techWithTags);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all technicians
const getTechnicians = async () => {
  try {
    const technicians = await Technician.findAll({
      include: [
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });
    return technicians;
  } catch (error) {
    throw error;
  }
};
const getTechniciansHandler = async (req, res) => {
  try {
    const technicians = await getTechnicians();
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
router.get('/', authMiddleware, getTechniciansHandler);

// Get a specific technician
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id, {
      include: [
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });
    if (technician) {
      res.json(technician);
    } else {
      res.status(404).json({ error: 'Technician not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a technician
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    const { tags, ...techData } = req.body;
    await technician.update(techData);

    // Handle tags if provided
    if (tags !== undefined) {
      await technician.setTags(tags.map(tag => tag.id));
    }

    // Return updated technician with tags
    const updatedTech = await Technician.findByPk(req.params.id, {
      include: [
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });

    res.json(updatedTech);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a technician
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const technician = await Technician.findByPk(req.params.id);
    if (technician) {
      await technician.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Technician not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export technicians to CSV
const { Parser } = require('json2csv');

router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    let technicians = await getTechnicians();

    // Filter by tags if provided
    const { tags } = req.query;
    if (tags) {
      const tagIds = tags.split(',').map(id => parseInt(id, 10));
      technicians = technicians.filter(tech =>
        tech.tags && tech.tags.some(tag => tagIds.includes(tag.id))
      );
    }

    // Transform data for CSV export
    const csvData = technicians.map(tech => {
      const plain = tech.toJSON();

      // Format tags as comma-separated list
      const tagList = plain.tags?.length > 0
        ? plain.tags.map(t => t.name).join(', ')
        : '';

      return {
        'ID': plain.id,
        'Name': plain.name || '',
        'Email': plain.email || '',
        'Phone Number': plain.phoneNumber || '',
        'Address': plain.address1 || '',
        'City': plain.city || '',
        'State': plain.state || '',
        'Zip': plain.zip || '',
        'Experience Level': plain.experienceLevel || '',
        'Active': plain.isActive ? 'Yes' : 'No',
        'Notes': plain.notes || '',
        'Tags': tagList
      };
    });

    // Define CSV fields
    const fields = [
      'ID', 'Name', 'Email', 'Phone Number', 'Address', 'City', 'State', 'Zip',
      'Experience Level', 'Active', 'Notes', 'Tags'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',
      `attachment; filename="technicians-export-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csv);
  } catch (error) {
    console.error('Error exporting technicians to CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {router, getTechnicians};