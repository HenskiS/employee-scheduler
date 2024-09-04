const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all events
router.get('/', (req, res) => {
  db.all('SELECT * FROM events', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get a single event
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'event not found' });
      return;
    }
    res.json(row);
  });
});

// Create a new event
router.post('/', (req, res) => {
  const { employee_id, client_id, start_time, end_time, name, details } = req.body;
  db.run(
    'INSERT INTO events (employee_id, client_id, start_time, end_time, name, details) VALUES (?, ?, ?, ?, ?, ?)',
    [employee_id, client_id, start_time, end_time, name, details],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id: this.lastID, employee_id, client_id, start_time, end_time, name, details });
    }
  );
});

// Update a event
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { employee_id, client_id, start_time, end_time, name, details } = req.body;
  db.run(
    'UPDATE events SET employee_id = ?, client_id = ?, start_time = ?, end_time = ?, name = ?, details = ? WHERE id = ?',
    [employee_id, client_id, start_time, end_time, name, details, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'event not found' });
        return;
      }
      res.json({ id, employee_id, client_id, start_time, end_time, name, details });
    }
  );
});

// Delete a event
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'event not found' });
      return;
    }
    res.json({ message: 'event deleted successfully' });
  });
});

// Get events for a specific employee
router.get('/employee/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  db.all('SELECT * FROM events WHERE employee_id = ?', [employeeId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get events for a specific client
router.get('/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  db.all('SELECT * FROM events WHERE client_id = ?', [clientId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get events for a specific date range
router.get('/range/:startDate/:endDate', (req, res) => {
  const { startDate, endDate } = req.params;
  db.all(
    'SELECT * FROM events WHERE start_time >= ? AND end_time <= ?',
    [startDate, endDate],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

module.exports = router;