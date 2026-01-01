const express = require('express');
const router = express.Router();
const { User, Tag } = require('../models');
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
    const { name, email, username, password, tags } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create(
      { name, email, username, password: hashedPassword },
      { transaction }
    );

    // Handle tags if provided
    if (tags && tags.length > 0) {
      await user.setTags(tags.map(tag => tag.id), { transaction });
    }

    await transaction.commit();

    // Return user with tags
    const userWithTags = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json(userWithTags);
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
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Tag,
            as: 'tags',
            through: { attributes: [] }
          }
        ]
      });
    } else {
      const user = await User.findOne({
        where: { id: userId },
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Tag,
            as: 'tags',
            through: { attributes: [] }
          }
        ]
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
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });
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
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { tags, ...userData } = req.body;

    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    if (!req.user.isAdmin) userData.isAdmin = false;

    await user.update(userData);

    // Handle tags if provided
    if (tags !== undefined) {
      await user.setTags(tags.map(tag => tag.id));
    }

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Tag,
          as: 'tags',
          through: { attributes: [] }
        }
      ]
    });

    res.json(updatedUser);
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

// Export users to CSV
const { Parser } = require('json2csv');

router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const { isAdmin, id } = req.user;
    let users = await getUsers(isAdmin, id);

    // Filter by tags if provided
    const { tags } = req.query;
    if (tags) {
      const tagIds = tags.split(',').map(id => parseInt(id, 10));
      users = users.filter(user =>
        user.tags && user.tags.some(tag => tagIds.includes(tag.id))
      );
    }

    // Transform data for CSV export
    const csvData = users.map(user => {
      const plain = user.toJSON();

      // Format tags as comma-separated list
      const tagList = plain.tags?.length > 0
        ? plain.tags.map(t => t.name).join(', ')
        : '';

      return {
        'ID': plain.id,
        'Name': plain.name || '',
        'Email': plain.email || '',
        'Username': plain.username || '',
        'Is Admin': plain.isAdmin ? 'Yes' : 'No',
        'Tags': tagList
      };
    });

    // Define CSV fields
    const fields = [
      'ID', 'Name', 'Email', 'Username', 'Is Admin', 'Tags'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',
      `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csv);
  } catch (error) {
    console.error('Error exporting users to CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {router, getUsers};