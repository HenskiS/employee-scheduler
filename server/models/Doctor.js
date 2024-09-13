const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address1: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address2: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  zip: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Doctor;