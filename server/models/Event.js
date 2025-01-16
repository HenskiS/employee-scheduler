const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  allDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  label: {
    type: DataTypes.STRING
  },
  jobNumber: {
    type: DataTypes.STRING
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  originalEventId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  recurrencePattern: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {paranoid: true, timestamps: true});

// Self-referential relationship for recurring events
Event.belongsTo(Event, { as: 'originalEvent', foreignKey: 'originalEventId' });
Event.hasMany(Event, { as: 'recurrences', foreignKey: 'originalEventId' });

module.exports = Event;