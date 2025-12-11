'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TechnicianTags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      TechnicianId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Technicians',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      TagId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tags',
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

    // Add unique constraint to prevent duplicate tags on same technician
    await queryInterface.addConstraint('TechnicianTags', {
      fields: ['TechnicianId', 'TagId'],
      type: 'unique',
      name: 'unique_technician_tag'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TechnicianTags');
  }
};
