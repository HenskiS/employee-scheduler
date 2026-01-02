'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add completion fields to EventTechnicians join table
    await queryInterface.addColumn('EventTechnicians', 'clockInTime', {
      type: Sequelize.TIME,
      allowNull: true
    });

    await queryInterface.addColumn('EventTechnicians', 'clockOutTime', {
      type: Sequelize.TIME,
      allowNull: true
    });

    await queryInterface.addColumn('EventTechnicians', 'numberOfCases', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Add timestamps if they don't exist
    try {
      await queryInterface.addColumn('EventTechnicians', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    } catch (error) {
      // Column might already exist, ignore error
      console.log('createdAt column may already exist');
    }

    try {
      await queryInterface.addColumn('EventTechnicians', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    } catch (error) {
      // Column might already exist, ignore error
      console.log('updatedAt column may already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('EventTechnicians', 'clockInTime');
    await queryInterface.removeColumn('EventTechnicians', 'clockOutTime');
    await queryInterface.removeColumn('EventTechnicians', 'numberOfCases');
    // Note: Not removing createdAt/updatedAt in down migration to avoid breaking other functionality
  }
};
