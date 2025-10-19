const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventCompletion = sequelize.define('EventCompletion', {
  EventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  jobNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  clockInTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  clockOutTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  numberOfCases: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = EventCompletion;
