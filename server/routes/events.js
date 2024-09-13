const express = require('express');
const router = express.Router();
const { addEvent, db } = require('../db/database');

// GET all events
router.get('/', (req, res) => {
  db.all(`
    SELECT e.*, l.name as label_name, p.name as created_by_name 
    FROM events e
    LEFT JOIN labels l ON e.label_id = l.id
    LEFT JOIN people p ON e.created_by = p.id
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET a single event
router.get('/:id', (req, res) => {
  db.get(`
    SELECT e.*, l.name as label_name, p.name as created_by_name 
    FROM events e
    LEFT JOIN labels l ON e.label_id = l.id
    LEFT JOIN people p ON e.created_by = p.id
    WHERE e.id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(row);
  });
});

// POST a new event
router.post('/', async (req, res) => {
  console.log(req.body)
  try {
    const eventId = await addEvent(req.body);
    res.status(201).json({ id: eventId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) an event
router.put('/:id', (req, res) => {
  const { name, description, start_time, end_time, is_all_day, label_id, created_by } = req.body;
  db.run(
    `UPDATE events SET 
      name = ?, description = ?, start_time = ?, end_time = ?, 
      is_all_day = ?, label_id = ?, created_by = ?
    WHERE id = ?`,
    [name, description, start_time, end_time, is_all_day ? 1 : 0, label_id, created_by, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Event not found' });
        return;
      }
      res.json({ message: 'Event updated successfully', id: req.params.id });
    }
  );
});

// DELETE an event
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM events WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ message: 'Event deleted successfully', id: req.params.id });
  });
});

module.exports = router;