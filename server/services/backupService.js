// services/backupService.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config')[process.env.NODE_ENV || 'development'];

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.retentionPolicy = {
      hourly: 24,    // Keep 24 hourly backups
      daily: 7,      // Keep 7 daily backups  
      weekly: 8,     // Keep 8 weekly backups
      manual: 10     // Keep 10 manual backups
    };
  }

  async init() {
    // Create backup directories
    const dirs = ['hourly', 'daily', 'weekly', 'manual'].map(type => 
      path.join(this.backupDir, type)
    );
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createBackup(type = 'hourly') {
    if (config.dialect !== 'postgres') {
      throw new Error('Backups only supported for PostgreSQL');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scheduling_app_${timestamp}_${type}.sql`;
    const backupPath = path.join(this.backupDir, type, filename);

    // Set password environment variable
    const env = { ...process.env, PGPASSWORD: config.password };

    const command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} --no-password --clean --if-exists`;

    try {
      const { stdout } = await execAsync(command, { env });
      await fs.writeFile(backupPath, stdout);
      
      console.log(`✅ Backup created: ${filename}`);
      return { success: true, filename, path: backupPath };
    } catch (error) {
      console.error(`❌ Backup failed:`, error.message);
      throw error;
    }
  }

  async listBackups() {
    const backups = { hourly: [], daily: [], weekly: [], manual: [] };
    
    for (const type of Object.keys(backups)) {
      const dir = path.join(this.backupDir, type);
      
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          if (file.endsWith('.sql')) {
            const filepath = path.join(dir, file);
            const stats = await fs.stat(filepath);
            
            backups[type].push({
              filename: file,
              size: stats.size,
              created: stats.birthtime,
              path: filepath
            });
          }
        }
        
        // Sort by creation time (newest first)
        backups[type].sort((a, b) => b.created - a.created);
      } catch (error) {
        // Directory might not exist yet
        console.warn(`Warning: Could not read ${type} backup directory`);
      }
    }
    
    return backups;
  }

  async restoreBackup(backupPath) {
    if (!await this.fileExists(backupPath)) {
      throw new Error('Backup file not found');
    }

    const env = { ...process.env, PGPASSWORD: config.password };
    const command = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -f "${backupPath}"`;

    try {
      await execAsync(command, { env });
      console.log(`✅ Database restored from: ${path.basename(backupPath)}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Restore failed:`, error.message);
      throw error;
    }
  }

  async cleanupBackups() {
    for (const [type, maxCount] of Object.entries(this.retentionPolicy)) {
      const dir = path.join(this.backupDir, type);
      
      try {
        const files = await fs.readdir(dir);
        const sqlFiles = files.filter(f => f.endsWith('.sql'));
        
        if (sqlFiles.length <= maxCount) continue;

        // Get file stats and sort by creation time
        const fileStats = await Promise.all(
          sqlFiles.map(async file => ({
            filename: file,
            path: path.join(dir, file),
            created: (await fs.stat(path.join(dir, file))).birthtime
          }))
        );

        fileStats.sort((a, b) => b.created - a.created);

        // Delete excess files
        const filesToDelete = fileStats.slice(maxCount);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`🗑️  Deleted old backup: ${file.filename}`);
        }
        
      } catch (error) {
        console.warn(`Warning: Could not cleanup ${type} backups:`, error.message);
      }
    }
  }

  async promoteBackups() {
    // Promote hourly to daily (if it's a new day)
    await this.promoteHourlyToDaily();
    
    // Promote daily to weekly (if it's Sunday)
    const now = new Date();
    if (now.getDay() === 0) { // Sunday
      await this.promoteDailyToWeekly();
    }
  }

  async promoteHourlyToDaily() {
    const hourlyDir = path.join(this.backupDir, 'hourly');
    const dailyDir = path.join(this.backupDir, 'daily');
    
    try {
      const files = await fs.readdir(hourlyDir);
      const sqlFiles = files.filter(f => f.endsWith('.sql'));
      
      if (sqlFiles.length === 0) return;

      // Get oldest hourly backup
      const fileStats = await Promise.all(
        sqlFiles.map(async file => ({
          filename: file,
          path: path.join(hourlyDir, file),
          created: (await fs.stat(path.join(hourlyDir, file))).birthtime
        }))
      );

      fileStats.sort((a, b) => a.created - b.created);
      const oldestFile = fileStats[0];

      // Copy to daily with new name
      const newFilename = oldestFile.filename.replace('_hourly.sql', '_daily.sql');
      const newPath = path.join(dailyDir, newFilename);
      
      await fs.copyFile(oldestFile.path, newPath);
      await fs.unlink(oldestFile.path);
      
      console.log(`📅 Promoted hourly backup to daily: ${newFilename}`);
    } catch (error) {
      console.warn('Warning: Could not promote hourly to daily:', error.message);
    }
  }

  async promoteDailyToWeekly() {
    const dailyDir = path.join(this.backupDir, 'daily');
    const weeklyDir = path.join(this.backupDir, 'weekly');
    
    try {
      const files = await fs.readdir(dailyDir);
      const sqlFiles = files.filter(f => f.endsWith('.sql'));
      
      if (sqlFiles.length === 0) return;

      // Get oldest daily backup
      const fileStats = await Promise.all(
        sqlFiles.map(async file => ({
          filename: file,
          path: path.join(dailyDir, file),
          created: (await fs.stat(path.join(dailyDir, file))).birthtime
        }))
      );

      fileStats.sort((a, b) => a.created - b.created);
      const oldestFile = fileStats[0];

      // Copy to weekly with new name
      const newFilename = oldestFile.filename.replace('_daily.sql', '_weekly.sql');
      const newPath = path.join(weeklyDir, newFilename);
      
      await fs.copyFile(oldestFile.path, newPath);
      await fs.unlink(oldestFile.path);
      
      console.log(`📆 Promoted daily backup to weekly: ${newFilename}`);
    } catch (error) {
      console.warn('Warning: Could not promote daily to weekly:', error.message);
    }
  }

  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new BackupService();