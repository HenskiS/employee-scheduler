'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing table completely
    await queryInterface.dropTable('Doctors');
    
    // Create the table with the new schema
    await queryInterface.createTable('Doctors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      customer: {
        type: Sequelize.STRING,
        allowNull: false
      },
      practiceName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      physicalAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      zip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      schedulingContact1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      schedulingPhone1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      schedulingEmail1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      schedulingContact2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      schedulingPhone2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      schedulingEmail2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billTo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingCity: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingState: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingZip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      billingContact: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mainPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fax: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // For rollback, we'd recreate the original table structure
    await queryInterface.dropTable('Doctors');
    
    await queryInterface.createTable('Doctors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      zip: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }
};