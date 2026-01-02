const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventTechnician = sequelize.define('EventTechnician', {
  EventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  TechnicianId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'Technicians',
      key: 'id'
    }
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
  timestamps: true,
  tableName: 'EventTechnicians'
});

module.exports = EventTechnician;
