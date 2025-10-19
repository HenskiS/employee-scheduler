'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#808080'
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

    // Insert default tags
    await queryInterface.bulkInsert('Tags', [
      { name: 'Late', color: '#ef4444', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cover', color: '#3b82f6', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Compliment', color: '#22c55e', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Complaint', color: '#f97316', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Request', color: '#a855f7', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tags');
  }
};
