'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Events', 'forAll', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      after: 'createdBy'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'forAll');
  }
};