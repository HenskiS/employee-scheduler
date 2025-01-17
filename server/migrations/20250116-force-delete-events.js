'use strict';

const { Op } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the list of events that will be deleted for the down migration
    const deletedEvents = await queryInterface.sequelize.query(
      'SELECT * FROM Events WHERE deletedAt IS NOT NULL',
      {
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // Store the deleted events in a backup table
    await queryInterface.createTable('EventsBackup_ForceDelete', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ...Object.keys(deletedEvents[0] || {}).reduce((acc, key) => {
        if (key !== 'id') {
          acc[key] = {
            type: Sequelize.STRING
          };
        }
        return acc;
      }, {}),
      backedUpAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    if (deletedEvents.length > 0) {
      await queryInterface.bulkInsert('EventsBackup_ForceDelete', deletedEvents);
    }

    // Force delete all soft-deleted events
    return queryInterface.sequelize.query(
      'DELETE FROM Events WHERE deletedAt IS NOT NULL'
    );
  },

  async down(queryInterface, Sequelize) {
    // Restore events from backup table
    const backedUpEvents = await queryInterface.sequelize.query(
      'SELECT * FROM EventsBackup_ForceDelete',
      {
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (backedUpEvents.length > 0) {
      // Remove the backup-specific fields
      const eventsToRestore = backedUpEvents.map(event => {
        const { backedUpAt, ...eventData } = event;
        return eventData;
      });

      await queryInterface.bulkInsert('Events', eventsToRestore);
    }

    // Drop the backup table
    return queryInterface.dropTable('EventsBackup_ForceDelete');
  }
};