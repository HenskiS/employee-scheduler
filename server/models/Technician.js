const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Technician = sequelize.define('Technician', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  experienceLevel: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Technician;