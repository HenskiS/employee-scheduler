'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add originalEventId and recurrencePattern to Events table
    await queryInterface.addColumn('Events', 'originalEventId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Events',
        key: 'id'
      }
    });

    await queryInterface.addColumn('Events', 'recurrencePattern', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Get all events with recurrence rules
    const events = await queryInterface.sequelize.query(
      `SELECT Events.*, RecurrenceRules.rule 
       FROM Events 
       INNER JOIN RecurrenceRules ON Events.id = RecurrenceRules.EventId`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // For each event with a recurrence rule
    for (const event of events) {
      // Update the event with its recurrence pattern
      await queryInterface.sequelize.query(
        `UPDATE Events 
         SET recurrencePattern = ?, isRecurring = true 
         WHERE id = ?`,
        {
          replacements: [event.rule, event.id],
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }

    // Drop the RecurrenceRules table
    await queryInterface.dropTable('RecurrenceRules');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate RecurrenceRules table
    await queryInterface.createTable('RecurrenceRules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rule: {
        type: Sequelize.STRING
      },
      EventId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Move recurrence patterns back to RecurrenceRules
    const events = await queryInterface.sequelize.query(
      `SELECT id, recurrencePattern 
       FROM Events 
       WHERE recurrencePattern IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const event of events) {
      await queryInterface.sequelize.query(
        `INSERT INTO RecurrenceRules (rule, EventId, createdAt, updatedAt) 
         VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        {
          replacements: [event.recurrencePattern, event.id],
          type: Sequelize.QueryTypes.INSERT
        }
      );
    }

    // Remove the new columns from Events
    await queryInterface.removeColumn('Events', 'recurrencePattern');
    await queryInterface.removeColumn('Events', 'originalEventId');
  }
};