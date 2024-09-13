const express = require('express');
const router = express.Router();
const { addUser, db } = require('../db/database');
const bcrypt = require('bcrypt');

// GET all users
router.get('/', (req, res) => {
  db.all('SELECT id, name, email, phone, username FROM people JOIN users ON people.id = users.id', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET a single user
router.get('/:id', (req, res) => {
  db.get('SELECT id, name, email, phone, username FROM people JOIN users ON people.id = users.id WHERE people.id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(row);
  });
});

// POST a new user
router.post('/', async (req, res) => {
  try {
    const userId = await addUser(req.body);
    res.status(201).json({ id: userId, ...req.body, password: undefined });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) a user
router.put('/:id', (req, res) => {
  const { name, email, phone, username, password } = req.body;
  db.run(
    'UPDATE people SET name = ?, email = ?, phone = ? WHERE id = ?',
    [name, email, phone, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      if (username || password) {
        if (password) {
          bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            db.run('UPDATE users SET username = ?, password = ? WHERE id = ?', [username, hash, req.params.id], (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json({ message: 'User updated successfully', id: req.params.id });
            });
          });
        } else {
          db.run('UPDATE users SET username = ? WHERE id = ?', [username, req.params.id], (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'User updated successfully', id: req.params.id });
          });
        }
      } else {
        res.json({ message: 'User updated successfully', id: req.params.id });
      }
    }
  );
});

// DELETE a user
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM people WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted successfully', id: req.params.id });
  });
});

module.exports = router;