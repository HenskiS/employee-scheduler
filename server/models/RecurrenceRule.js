const { DataTypes, STRING } = require('sequelize');
const sequelize = require('../config/database');

const RecurrenceRule = sequelize.define('RecurrenceRule', {
  rule: DataTypes.STRING
});

module.exports = RecurrenceRule;