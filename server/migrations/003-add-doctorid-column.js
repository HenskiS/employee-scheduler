// migrations/003-add-doctorid-column.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the missing DoctorId foreign key column
    await queryInterface.addColumn('DoctorEmails', 'DoctorId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Doctors',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add index for performance
    await queryInterface.addIndex('DoctorEmails', ['DoctorId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('DoctorEmails', 'DoctorId');
  }
};