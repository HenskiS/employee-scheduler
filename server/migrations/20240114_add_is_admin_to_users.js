module.exports = {
    up: async (queryInterface, Sequelize) => {
      // First, add the isAdmin column with default value of false
      await queryInterface.addColumn('Users', 'isAdmin', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
  
      // Then update all existing users to have isAdmin = true
      await queryInterface.sequelize.query(`
        UPDATE Users 
        SET isAdmin = true 
        WHERE isAdmin = false OR isAdmin IS NULL
      `);
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn('Users', 'isAdmin');
    }
  };