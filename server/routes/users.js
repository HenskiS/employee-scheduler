const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const jwt = require('jsonwebtoken');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create({ name, email, username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (protected route)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific user (protected route)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user (protected route)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      if (req.body.password) {
        req.body.password = await hashPassword(req.body.password);
      }
      await user.update(req.body);
      res.json({ message: 'User updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a user (protected route)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;