const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Technician = sequelize.define('Technician', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  experienceLevel: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Technician;