const express = require('express');
const router = express.Router();
const { addTechnician, db } = require('../db/database');

// GET all technicians
router.get('/', (req, res) => {
  db.all(`
    SELECT p.id, p.name, p.email, p.phone 
    FROM people p 
    JOIN technicians t ON p.id = t.id
    WHERE p.type = 'technician'
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET a single technician
router.get('/:id', (req, res) => {
  db.get(`
    SELECT p.id, p.name, p.email, p.phone 
    FROM people p 
    JOIN technicians t ON p.id = t.id
    WHERE p.id = ? AND p.type = 'technician'
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Technician not found' });
      return;
    }
    res.json(row);
  });
});

// POST a new technician
router.post('/', async (req, res) => {
  try {
    const technicianId = await addTechnician(req.body);
    res.status(201).json({ id: technicianId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) a technician
router.put('/:id', (req, res) => {
  const { name, email, phone } = req.body;
  db.run(
    'UPDATE people SET name = ?, email = ?, phone = ? WHERE id = ? AND type = "technician"',
    [name, email, phone, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Technician not found' });
        return;
      }
      res.json({ message: 'Technician updated successfully', id: req.params.id });
    }
  );
});

// DELETE a technician
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM people WHERE id = ? AND type = "technician"', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Technician not found' });
      return;
    }
    res.json({ message: 'Technician deleted successfully', id: req.params.id });
  });
});

module.exports = router;