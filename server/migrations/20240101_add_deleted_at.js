module.exports = {
    up: async (queryInterface, Sequelize) => {
      // Add deletedAt column to all tables that need it
      await queryInterface.addColumn('Events', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
      // Add for any other tables that need paranoid mode
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('Events', 'deletedAt');
      // Remove from any other tables
    }
  };
// To migrate, run npx sequelize-cli db:migrate