'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tags', 'appliesTo', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: ['event']
    });

    // Update all existing tags to have appliesTo = ['event']
    await queryInterface.sequelize.query(
      `UPDATE "Tags" SET "appliesTo" = '["event"]' WHERE "appliesTo" IS NULL`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tags', 'appliesTo');
  }
};
