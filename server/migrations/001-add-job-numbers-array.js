// migrations/001-add-job-numbers-array.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add new array column
      await queryInterface.addColumn('Events', 'jobNumbers', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      }, { transaction });

      // Populate it with existing data
      await queryInterface.sequelize.query(`
        UPDATE "Events" 
        SET "jobNumbers" = CASE 
          WHEN "jobNumber" IS NOT NULL AND "jobNumber" != '' 
          THEN ARRAY["jobNumber"] 
          ELSE ARRAY[]::text[] 
        END
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Events', 'jobNumbers');
  }
};