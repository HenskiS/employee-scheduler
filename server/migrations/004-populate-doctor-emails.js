// migrations/004-populate-doctor-emails.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migrate existing schedulingEmail1 data (as primary scheduling emails)
    await queryInterface.sequelize.query(`
      INSERT INTO "DoctorEmails" (email, "isPrimary", type, label, "DoctorId", "createdAt", "updatedAt")
      SELECT
        "schedulingEmail1",
        true,
        'scheduling',
        'Scheduling Contact 1',
        id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "Doctors"
      WHERE "schedulingEmail1" IS NOT NULL
        AND "schedulingEmail1" != ''
        AND "schedulingEmail1" != 'NULL'
    `);

    // Migrate existing schedulingEmail2 data (as secondary scheduling emails)
    // Only if it's different from schedulingEmail1
    await queryInterface.sequelize.query(`
      INSERT INTO "DoctorEmails" (email, "isPrimary", type, label, "DoctorId", "createdAt", "updatedAt")
      SELECT
        "schedulingEmail2",
        false,
        'scheduling',
        'Scheduling Contact 2',
        id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "Doctors"
      WHERE "schedulingEmail2" IS NOT NULL
        AND "schedulingEmail2" != ''
        AND "schedulingEmail2" != 'NULL'
        AND "schedulingEmail2" != "schedulingEmail1"
        AND NOT EXISTS (
          SELECT 1 FROM "DoctorEmails"
          WHERE "DoctorEmails"."DoctorId" = "Doctors".id
          AND "DoctorEmails".email = "Doctors"."schedulingEmail2"
        )
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all migrated email data
    await queryInterface.sequelize.query(`
      DELETE FROM "DoctorEmails"
      WHERE label IN ('Scheduling Contact 1', 'Scheduling Contact 2')
    `);
  }
};