const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoctorEmail = sequelize.define('DoctorEmail', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  type: {
    type: DataTypes.ENUM('scheduling', 'billing', 'general'),
    allowNull: false,
    defaultValue: 'general'
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Optional label for the email (e.g., "Office Manager", "After Hours")'
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['DoctorId', 'email'],
      name: 'unique_doctor_email'
    }
  ],
  validate: {
    // Ensure only one primary email per doctor per type
    async onlyOnePrimaryPerType() {
      if (this.isPrimary) {
        const existing = await DoctorEmail.findOne({
          where: {
            DoctorId: this.DoctorId,
            type: this.type,
            isPrimary: true,
            id: { [sequelize.Sequelize.Op.ne]: this.id || 0 }
          }
        });
        if (existing) {
          throw new Error(`Doctor already has a primary ${this.type} email`);
        }
      }
    }
  }
});

module.exports = DoctorEmail;