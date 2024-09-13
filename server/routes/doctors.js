const express = require('express');
const router = express.Router();
const { addDoctor, db } = require('../db/database');

// GET all doctors
router.get('/', (req, res) => {
  db.all(`
    SELECT p.id, p.name, p.email, p.phone, d.address1, d.address2, d.city, d.state, d.zip 
    FROM people p 
    JOIN doctors d ON p.id = d.id
    WHERE p.type = 'doctor'
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET a single doctor
router.get('/:id', (req, res) => {
  db.get(`
    SELECT p.id, p.name, p.email, p.phone, d.address1, d.address2, d.city, d.state, d.zip 
    FROM people p 
    JOIN doctors d ON p.id = d.id
    WHERE p.id = ? AND p.type = 'doctor'
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json(row);
  });
});

// POST a new doctor
router.post('/', async (req, res) => {
  try {
    const doctorId = await addDoctor(req.body);
    res.status(201).json({ id: doctorId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) a doctor
router.put('/:id', (req, res) => {
  const { name, email, phone, address1, address2, city, state, zip } = req.body;
  db.run(
    'UPDATE people SET name = ?, email = ?, phone = ? WHERE id = ? AND type = "doctor"',
    [name, email, phone, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Doctor not found' });
        return;
      }
      db.run(
        'UPDATE doctors SET address1 = ?, address2 = ?, city = ?, state = ?, zip = ? WHERE id = ?',
        [address1, address2, city, state, zip, req.params.id],
        (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ message: 'Doctor updated successfully', id: req.params.id });
        }
      );
    }
  );
});

// DELETE a doctor
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM people WHERE id = ? AND type = "doctor"', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    res.json({ message: 'Doctor deleted successfully', id: req.params.id });
  });
});

module.exports = router;