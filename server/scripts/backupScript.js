// scripts/backupScript.js
// Standalone script for Windows Task Scheduler
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const backupService = require('../services/backupService');

async function runBackup() {
  const args = process.argv.slice(2);
  const action = args[0] || 'backup';

  console.log(`🕐 Starting backup script - Action: ${action}`);
  console.log(`📅 ${new Date().toLocaleString()}`);

  try {
    await backupService.init();

    switch (action) {
      case 'backup':
        await backupService.createBackup('hourly');
        break;
        
      case 'cleanup':
        await backupService.cleanupBackups();
        break;
        
      case 'promote':
        await backupService.promoteBackups();
        break;
        
      case 'full':
        // Full maintenance cycle
        await backupService.createBackup('hourly');
        await backupService.promoteBackups();
        await backupService.cleanupBackups();
        break;
        
      default:
        console.error(`❌ Unknown action: ${action}`);
        console.log('Available actions: backup, cleanup, promote, full');
        process.exit(1);
    }

    console.log('✅ Backup script completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Backup script failed:', error.message);
    process.exit(1);
  }
}

runBackup();