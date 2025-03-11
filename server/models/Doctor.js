const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  customer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  practiceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  physicalAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedulingContact1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedulingPhone1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedulingEmail1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedulingContact2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedulingPhone2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedulingEmail2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billTo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingCity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingState: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingZip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  billingContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mainPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fax: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Doctor;