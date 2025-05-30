// config/config.js - Updated to support both SQLite and PostgreSQL
const path = require('path');

module.exports = {
  development_sqlite: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: console.log // Enable logging for development
  },
  
  // Add PostgreSQL development config for testing migration
  development: {
    username: 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'scheduling_app_dev',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    username: 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'scheduling_app_prod', 
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false, // Disable logging in production
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Additional production settings
    dialectOptions: {
      ssl: false // Set to true if using SSL
    }
  },
  
  // Keep test environment as SQLite for faster tests
  test: {
    dialect: 'sqlite',
    storage: ':memory:', // In-memory database for tests
    logging: false
  }
};

// Export helper function to get database config
module.exports.getDatabaseConfig = function(environment = process.env.NODE_ENV || 'development') {
  const config = module.exports[environment];
  if (!config) {
    throw new Error(`Database configuration for environment "${environment}" not found`);
  }
  return config;
};