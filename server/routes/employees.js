const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all employees
router.get('/', (req, res) => {
  db.all('SELECT * FROM employees', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get a single employee
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json(row);
  });
});

// Create a new employee
router.post('/', (req, res) => {
  const { name, role } = req.body;
  db.run('INSERT INTO employees (name, role) VALUES (?, ?)', [name, role], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, name, role });
  });
});

// Update an employee
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;
  db.run('UPDATE employees SET name = ?, role = ? WHERE id = ?', [name, role, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json({ id, name, role });
  });
});

// Delete an employee
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM employees WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json({ message: 'Employee deleted successfully' });
  });
});

module.exports = router;