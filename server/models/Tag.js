const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define('Tag', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#808080'
  },
  appliesTo: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['event'],
    comment: 'Array of entity types this tag can be applied to: event, doctor, technician, user'
  }
}, {
  timestamps: true
});

module.exports = Tag;
