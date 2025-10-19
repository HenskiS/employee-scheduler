'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add officeNotes field
      await queryInterface.addColumn('Events', 'officeNotes', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      // Add confirmed field
      await queryInterface.addColumn('Events', 'confirmed', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });

      // Add confirmedAt field
      await queryInterface.addColumn('Events', 'confirmedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Events', 'confirmedAt', { transaction });
      await queryInterface.removeColumn('Events', 'confirmed', { transaction });
      await queryInterface.removeColumn('Events', 'officeNotes', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
