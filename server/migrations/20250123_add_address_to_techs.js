'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Technicians', 'address1', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Technicians', 'city', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Technicians', 'state', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Technicians', 'zip', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Technicians', 'address1');
    await queryInterface.removeColumn('Technicians', 'city');
    await queryInterface.removeColumn('Technicians', 'state');
    await queryInterface.removeColumn('Technicians', 'zip');
  }
};