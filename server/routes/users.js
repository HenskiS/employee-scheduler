const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const jwt = require('jsonwebtoken');

// Register a new user (protected)
router.post('/', authMiddleware, async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const transaction = await User.sequelize.transaction();
  try {
    const { name, email, username, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create(
      { name, email, username, password: hashedPassword },
      { transaction }
    );
    const userObject = user.toJSON();
    
    await transaction.commit();
    const { password: _, ...userWithoutPassword } = userObject;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    await transaction.rollback();
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
    const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (protected route)
const getUsers = async (isAdmin, userId) => {
  try {
    if (isAdmin) {
      return await User.findAll({
        attributes: { exclude: ['password'] }
      });
    } else {
      const user = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ['password'] }
      });
      return [user];
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
const getUsersHandler = async (req, res) => {
  try {
    const { isAdmin, id } = req.user;
    const users = await getUsers(isAdmin, id);
    return res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
router.get('/', authMiddleware, getUsersHandler);

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
      if (!req.user.isAdmin) req.body.isAdmin = false;
      await user.update(req.body);
      const updatedUser = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });
      res.json(updatedUser);
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

module.exports = {router, getUsers};