// config/database.js - Enhanced with migration support
const { Sequelize } = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];

// Create Sequelize instance
const sequelize = new Sequelize(config);

// Test connection function
sequelize.testConnection = async function() {
  try {
    await this.authenticate();
    console.log(`✅ Database connection established successfully (${config.dialect})`);
    
    if (config.dialect === 'postgres') {
      const result = await this.query('SELECT version()');
      console.log(`   PostgreSQL version: ${result[0][0].version.split(' ')[1]}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// Migration helper functions
sequelize.migrateToPostgreSQL = async function() {
  const originalConfig = { ...config };
  
  if (originalConfig.dialect !== 'sqlite') {
    throw new Error('Migration is only supported from SQLite to PostgreSQL');
  }
  
  console.log('🔄 Starting migration to PostgreSQL...');
  
  // Step 1: Export SQLite data
  console.log('📤 Exporting SQLite data...');
  const exportData = await this.exportAllTables();
  
  // Step 2: Switch to PostgreSQL
  console.log('🔀 Switching to PostgreSQL...');
  process.env.NODE_ENV = 'development_postgres';
  
  // Create new PostgreSQL connection
  const pgConfig = require('./config')['development_postgres'];
  const pgSequelize = new Sequelize(pgConfig);
  
  // Step 3: Test PostgreSQL connection
  await pgSequelize.authenticate();
  console.log('✅ PostgreSQL connection established');
  
  // Step 4: Sync models (create tables)
  console.log('🏗️  Creating PostgreSQL tables...');
  await pgSequelize.sync({ force: true }); // This will drop and recreate tables
  
  // Step 5: Import data
  console.log('📥 Importing data to PostgreSQL...');
  await this.importAllTables(pgSequelize, exportData);
  
  console.log('✅ Migration completed successfully!');
  
  return pgSequelize;
};

sequelize.exportAllTables = async function() {
  const queryInterface = this.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const exportData = {};
  
  for (const tableName of tables) {
    if (tableName === 'SequelizeMeta') continue; // Skip migration tracking table
    
    console.log(`   Exporting ${tableName}...`);
    const [results] = await this.query(`SELECT * FROM ${tableName}`);
    exportData[tableName] = results;
    console.log(`   ✅ Exported ${results.length} records from ${tableName}`);
  }
  
  return exportData;
};

sequelize.importAllTables = async function(targetSequelize, exportData) {
  for (const [tableName, data] of Object.entries(exportData)) {
    if (data.length === 0) continue;
    
    console.log(`   Importing ${tableName}...`);
    
    try {
      // Build INSERT query
      const columns = Object.keys(data[0]);
      const columnNames = columns.map(col => `"${col}"`).join(', ');
      
      for (const row of data) {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'boolean') return value;
          if (value instanceof Date) return `'${value.toISOString()}'`;
          return value;
        }).join(', ');
        
        const insertQuery = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values})`;
        await targetSequelize.query(insertQuery);
      }
      
      console.log(`   ✅ Imported ${data.length} records to ${tableName}`);
    } catch (error) {
      console.error(`   ❌ Failed to import ${tableName}:`, error.message);
    }
  }
};

// Backup function
sequelize.createBackup = async function(backupPath) {
  if (config.dialect === 'sqlite') {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(path.dirname(backupPath))) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    }
    
    fs.copyFileSync(config.storage, backupPath);
    console.log(`📄 SQLite backup created: ${backupPath}`);
  } else if (config.dialect === 'postgres') {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Set password environment variable
    process.env.PGPASSWORD = config.password;
    
    const command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} --no-password --clean --if-exists > "${backupPath}"`;
    
    try {
      await execAsync(command);
      console.log(`📄 PostgreSQL backup created: ${backupPath}`);
    } finally {
      delete process.env.PGPASSWORD;
    }
  }
};

module.exports = sequelize;