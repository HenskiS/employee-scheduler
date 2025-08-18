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
        console.log('🧹 Local and cloud cleanup completed');
        break;
        
      case 'promote':
        await backupService.promoteBackups();
        console.log('⬆️  Backup promotion completed');
        break;
        
      case 'full':
        // Full maintenance cycle
        console.log('🔄 Starting full maintenance cycle...');
        await backupService.createBackup('hourly');
        await backupService.promoteBackups();
        await backupService.cleanupBackups();
        console.log('✨ Full maintenance cycle completed');
        break;

      case 'cloud-cleanup':
        // Clean up only cloud backups
        await backupService.cleanupDropboxBackups();
        console.log('☁️🧹 Cloud cleanup completed');
        break;

      case 'cloud-sync':
        // Manually sync latest daily backup to cloud
        const backups = await backupService.listBackups();
        if (backups.daily.length > 0) {
          const latest = backups.daily[0];
          await backupService.uploadToDropbox(latest.path, latest.filename);
          console.log('☁️⬆️  Latest daily backup synced to cloud');
        } else {
          console.log('⚠️  No daily backups found to sync');
        }
        break;

      case 'status':
        // Show backup status
        const status = await backupService.getStatus();
        console.log('\n📊 Backup Status:');
        console.log(`   Total backups: ${status.totalBackups}`);
        console.log(`   Local size: ${(status.totalLocalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Hourly: ${status.byType.hourly}`);
        console.log(`   Daily: ${status.byType.daily}`);
        console.log(`   Weekly: ${status.byType.weekly}`);
        console.log(`   Manual: ${status.byType.manual}`);
        console.log(`   Cloud: ${status.byType.cloud}`);
        console.log(`   Last backup: ${status.lastBackup || 'None'}`);
        console.log(`   Last cloud backup: ${status.lastCloudBackup || 'None'}`);
        console.log(`   Dropbox enabled: ${status.dropboxEnabled ? 'Yes' : 'No'}`);
        break;
        
      default:
        console.error(`❌ Unknown action: ${action}`);
        console.log('Available actions:');
        console.log('  backup       - Create hourly backup');
        console.log('  cleanup      - Clean up old backups (local + cloud)');
        console.log('  promote      - Promote backups (hourly→daily→weekly)');
        console.log('  full         - Full maintenance cycle');
        console.log('  cloud-cleanup- Clean up only cloud backups');
        console.log('  cloud-sync   - Sync latest daily backup to cloud');
        console.log('  status       - Show backup system status');
        process.exit(1);
    }

    console.log('✅ Backup script completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Backup script failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

runBackup();