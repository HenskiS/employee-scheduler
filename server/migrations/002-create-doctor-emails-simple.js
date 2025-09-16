// migrations/002-create-doctor-emails-simple.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create DoctorEmails table
    await queryInterface.createTable('DoctorEmails', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isPrimary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      type: {
        type: Sequelize.ENUM('scheduling', 'billing', 'general'),
        allowNull: false,
        defaultValue: 'general'
      },
      label: {
        type: Sequelize.STRING,
        allowNull: true
      },
      DoctorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Doctors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the table (this will also remove indexes)
    await queryInterface.dropTable('DoctorEmails');

    // Remove the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DoctorEmails_type"');
  }
};