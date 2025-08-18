// services/backupService.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { Dropbox } = require('dropbox');
const config = require('../config/config')[process.env.NODE_ENV || 'development'];
const dropboxAuth = require('./dropboxAuth');

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.retentionPolicy = {
      hourly: 24,    // Keep 24 hourly backups
      daily: 7,      // Keep 7 daily backups  
      weekly: 8,     // Keep 8 weekly backups
      manual: 10,    // Keep 10 manual backups
      cloud: 14      // Keep 14 daily backups in Dropbox
    };
    
    this.dropbox = null;
    this.dropboxPath = '/backups/daily';
  }

  async init() {
    // Create backup directories
    const dirs = ['hourly', 'daily', 'weekly', 'manual'].map(type => 
      path.join(this.backupDir, type)
    );
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Initialize Dropbox with proper auth handling
    try {
      this.dropbox = await dropboxAuth.init();
      if (this.dropbox) {
        await this.ensureDropboxFolder();
        console.log('✅ Dropbox connection verified');
      } else {
        console.log('ℹ️ Dropbox requires authorization. Visit /setup/dropbox to authorize.');
      }
    } catch (error) {
      console.warn('⚠️ Dropbox connection failed:', error.message);
      this.dropbox = null;
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
      
      // Upload daily backups to Dropbox
      if (type === 'daily' && this.dropbox) {
        try {
          await this.uploadToDropbox(backupPath, filename);
        } catch (error) {
          console.warn('⚠️ Dropbox upload failed:', error.message);
          // Don't fail the whole backup if cloud upload fails
        }
      }
      
      return { success: true, filename, path: backupPath };
    } catch (error) {
      console.error(`❌ Backup failed:`, error.message);
      throw error;
    }
  }

  async uploadToDropbox(localPath, filename, retries = 3) {
    await this.ensureDropboxClient();
    
    if (!this.dropbox) {
      throw new Error('Dropbox not configured. Visit /setup/dropbox to authorize.');
    }

    const remotePath = `${this.dropboxPath}/${filename}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const fileBuffer = await fs.readFile(localPath);
        
        await this.dropbox.filesUpload({
          path: remotePath,
          contents: fileBuffer,
          mode: 'overwrite',
          autorename: false
        });
        
        console.log(`☁️ Uploaded to Dropbox: ${filename}`);
        return { success: true, remotePath };
        
      } catch (error) {
        // If token expired, try to refresh
        if (error.status === 401 && attempt === 1) {
          console.log('🔄 Token expired during upload, refreshing...');
          try {
            this.dropbox = await dropboxAuth.init();
            continue; // Retry with new token
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError.message);
          }
        }
        
        console.warn(`⚠️ Dropbox upload attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async listBackups() {
    const backups = { 
      hourly: [], 
      daily: [], 
      weekly: [], 
      manual: [],
      cloud: []
    };
    
    // List local backups
    for (const type of ['hourly', 'daily', 'weekly', 'manual']) {
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
              path: filepath,
              location: 'local'
            });
          }
        }
        
        // Sort by creation time (newest first)
        backups[type].sort((a, b) => b.created - a.created);
      } catch (error) {
        console.warn(`Warning: Could not read ${type} backup directory`);
      }
    }
    
    // List cloud backups
    if (this.dropbox) {
      try {
        const cloudBackups = await this.listDropboxBackups();
        backups.cloud = cloudBackups;
      } catch (error) {
        console.warn('Warning: Could not list Dropbox backups:', error.message);
      }
    }
    
    return backups;
  }

  async listDropboxBackups() {
    await this.ensureDropboxClient();
    
    if (!this.dropbox) {
      return [];
    }

    try {
      const response = await this.dropbox.filesListFolder({
        path: this.dropboxPath
      });

      const backups = response.result.entries
        .filter(entry => entry.name.endsWith('.sql'))
        .map(entry => ({
          filename: entry.name,
          size: entry.size,
          created: new Date(entry.server_modified),
          path: entry.path_display,
          location: 'dropbox'
        }))
        .sort((a, b) => b.created - a.created);

      return backups;
    } catch (error) {
      if (error.status === 401) {
        console.log('🔄 Token expired, refreshing...');
        try {
          this.dropbox = await dropboxAuth.init();
          // Retry the operation
          return await this.listDropboxBackups();
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message);
          return [];
        }
      }
      
      if (error.status === 409) {
        return []; // Folder doesn't exist
      }
      throw error;
    }
  }

  async downloadFromDropbox(remotePath, localPath) {
    if (!this.dropbox) {
      throw new Error('Dropbox not configured');
    }

    try {
      const response = await this.dropbox.filesDownload({ path: remotePath });
      await fs.writeFile(localPath, response.result.fileBinary);
      
      console.log(`📥 Downloaded from Dropbox: ${path.basename(remotePath)}`);
      return { success: true, localPath };
    } catch (error) {
      if (error.status === 401) {
        console.log('🔄 Token expired during download, refreshing...');
        try {
          this.dropbox = await dropboxAuth.init();
          // Retry the operation
          return await this.downloadFromDropbox(remotePath, localPath);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message);
        }
      }
      console.error('❌ Dropbox download failed:', error.message);
      throw error;
    }
  }

  async restoreBackup(backupPath, isDropboxPath = false) {
    let localPath = backupPath;
    
    // If it's a Dropbox path, download it first
    if (isDropboxPath) {
      const tempPath = path.join(__dirname, '..', 'temp', `restore_${Date.now()}.sql`);
      await fs.mkdir(path.dirname(tempPath), { recursive: true });
      
      await this.downloadFromDropbox(backupPath, tempPath);
      localPath = tempPath;
    }

    if (!await this.fileExists(localPath)) {
      throw new Error('Backup file not found');
    }

    const env = { ...process.env, PGPASSWORD: config.password };
    const command = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} -f "${localPath}"`;

    try {
      await execAsync(command, { env });
      console.log(`✅ Database restored from: ${path.basename(localPath)}`);
      
      // Clean up temp file if it was downloaded
      if (isDropboxPath) {
        await fs.unlink(localPath).catch(() => {});
      }
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Restore failed:`, error.message);
      
      // Clean up temp file if it was downloaded
      if (isDropboxPath) {
        await fs.unlink(localPath).catch(() => {});
      }
      
      throw error;
    }
  }

  async cleanupBackups() {
    // Clean up local backups
    for (const [type, maxCount] of Object.entries(this.retentionPolicy)) {
      if (type === 'cloud') continue; // Handle cloud separately
      
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
          console.log(`🗑️ Deleted old backup: ${file.filename}`);
        }
        
      } catch (error) {
        console.warn(`Warning: Could not cleanup ${type} backups:`, error.message);
      }
    }

    // Clean up Dropbox backups
    if (this.dropbox) {
      try {
        await this.cleanupDropboxBackups();
      } catch (error) {
        console.warn('Warning: Could not cleanup Dropbox backups:', error.message);
      }
    }
  }

  async cleanupDropboxBackups() {
    if (!this.dropbox) return;

    try {
      const cloudBackups = await this.listDropboxBackups();
      const maxCount = this.retentionPolicy.cloud;
      
      if (cloudBackups.length <= maxCount) return;

      // Delete excess files (oldest first)
      const filesToDelete = cloudBackups.slice(maxCount);
      
      for (const file of filesToDelete) {
        try {
          await this.dropbox.filesDeleteV2({ path: file.path });
          console.log(`☁️🗑️ Deleted old Dropbox backup: ${file.filename}`);
        } catch (error) {
          if (error.status === 401) {
            console.log('🔄 Token expired during cleanup, refreshing...');
            try {
              this.dropbox = await dropboxAuth.init();
              // Retry the operation
              await this.dropbox.filesDeleteV2({ path: file.path });
              console.log(`☁️🗑️ Deleted old Dropbox backup: ${file.filename}`);
            } catch (refreshError) {
              console.warn(`Warning: Could not delete ${file.filename}:`, refreshError.message);
            }
          } else {
            console.warn(`Warning: Could not delete ${file.filename}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Dropbox cleanup failed:', error.message);
    }
  }

  async ensureDropboxFolder() {
    if (!this.dropbox) return;

    try {
      await this.dropbox.filesGetMetadata({ path: this.dropboxPath });
    } catch (error) {
      if (error.status === 401) {
        console.log('🔄 Token expired during folder check, refreshing...');
        try {
          this.dropbox = await dropboxAuth.init();
          // Retry the operation
          await this.dropbox.filesGetMetadata({ path: this.dropboxPath });
        } catch (refreshError) {
          if (refreshError.status === 409) {
            // Folder doesn't exist, create it
            await this.createDropboxFolder();
          } else {
            throw refreshError;
          }
        }
      } else if (error.status === 409) {
        // Folder doesn't exist, create it
        await this.createDropboxFolder();
      } else {
        throw error;
      }
    }
  }

  async createDropboxFolder() {
    if (!this.dropbox) return;

    try {
      await this.dropbox.filesCreateFolderV2({ path: this.dropboxPath });
      console.log(`📁 Created Dropbox folder: ${this.dropboxPath}`);
    } catch (error) {
      if (error.status === 401) {
        console.log('🔄 Token expired during folder creation, refreshing...');
        try {
          this.dropbox = await dropboxAuth.init();
          // Retry the operation
          await this.dropbox.filesCreateFolderV2({ path: this.dropboxPath });
          console.log(`📁 Created Dropbox folder: ${this.dropboxPath}`);
        } catch (refreshError) {
          console.warn('Warning: Could not create Dropbox folder:', refreshError.message);
        }
      } else {
        console.warn('Warning: Could not create Dropbox folder:', error.message);
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

      // Get newest hourly backup (changed from oldest)
      const fileStats = await Promise.all(
        sqlFiles.map(async file => ({
          filename: file,
          path: path.join(hourlyDir, file),
          created: (await fs.stat(path.join(hourlyDir, file))).birthtime
        }))
      );

      fileStats.sort((a, b) => b.created - a.created);
      const newestFile = fileStats[0];

      // Copy to daily with new name
      const newFilename = newestFile.filename.replace('_hourly.sql', '_daily.sql');
      const newPath = path.join(dailyDir, newFilename);
      
      await fs.copyFile(newestFile.path, newPath);
      await fs.unlink(newestFile.path);
      
      console.log(`📅 Promoted hourly backup to daily: ${newFilename}`);

      // Upload the promoted daily backup to Dropbox
      if (this.dropbox) {
        try {
          await this.uploadToDropbox(newPath, newFilename);
        } catch (error) {
          console.warn('⚠️ Failed to upload promoted backup to Dropbox:', error.message);
        }
      }
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

      // Get newest daily backup (changed from oldest)
      const fileStats = await Promise.all(
        sqlFiles.map(async file => ({
          filename: file,
          path: path.join(dailyDir, file),
          created: (await fs.stat(path.join(dailyDir, file))).birthtime
        }))
      );

      fileStats.sort((a, b) => b.created - a.created);
      const newestFile = fileStats[0];

      // Copy to weekly with new name
      const newFilename = newestFile.filename.replace('_daily.sql', '_weekly.sql');
      const newPath = path.join(weeklyDir, newFilename);
      
      await fs.copyFile(newestFile.path, newPath);
      await fs.unlink(newestFile.path);
      
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

  // Helper method to ensure we have a working Dropbox client
  async ensureDropboxClient() {
    if (!this.dropbox) {
      this.dropbox = dropboxAuth.getDropboxClient();
    }
    
    if (!this.dropbox) {
      this.dropbox = await dropboxAuth.init();
    }
    
    return this.dropbox;
  }

  // Get backup system status including cloud info
  async getStatus() {
    const backups = await this.listBackups();
    const totalBackups = Object.values(backups).reduce((sum, arr) => sum + arr.length, 0);
    const localBackups = ['hourly', 'daily', 'weekly', 'manual']
      .map(type => backups[type])
      .flat();
    const totalLocalSize = localBackups.reduce((sum, backup) => sum + backup.size, 0);

    // Always get fresh Dropbox client and test connection
    let dropboxConnected = false;
    try {
      const freshClient = dropboxAuth.getDropboxClient();
      if (freshClient) {
        await freshClient.usersGetCurrentAccount();
        dropboxConnected = true;
        // Update our stored client if it's working
        this.dropbox = freshClient;
      }
    } catch (error) {
      if (error.status === 401) {
        console.log('🔄 Token expired during status check, refreshing...');
        try {
          this.dropbox = await dropboxAuth.init();
          if (this.dropbox) {
            await this.dropbox.usersGetCurrentAccount();
            dropboxConnected = true;
          }
        } catch (refreshError) {
          console.warn('Warning: Could not refresh Dropbox token:', refreshError.message);
          dropboxConnected = false;
        }
      } else {
        console.warn('Warning: Dropbox connection test failed:', error.message);
        dropboxConnected = false;
      }
    }

    return {
      totalBackups,
      totalLocalSize,
      byType: {
        hourly: backups.hourly.length,
        daily: backups.daily.length,
        weekly: backups.weekly.length,
        manual: backups.manual.length,
        cloud: backups.cloud.length
      },
      lastBackup: backups.hourly[0]?.created || backups.daily[0]?.created || null,
      lastCloudBackup: backups.cloud[0]?.created || null,
      dropboxEnabled: dropboxConnected
    };
  }
}

module.exports = new BackupService();