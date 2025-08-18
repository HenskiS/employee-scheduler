import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CloudDownload as CloudDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Computer as ComputerIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import axios from '../api/axios';

function BackupDialog({ open, onClose }) {
  const [backups, setBackups] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open) {
      loadBackups();
      loadStatus();
    }
  }, [open]);

  const loadBackups = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/backup');
      setBackups(response.data.backups);
    } catch (err) {
      setError('Failed to load backups');
    }
    setLoading(false);
  };

  const loadStatus = async () => {
    try {
      const response = await axios.get('/backup/status');
      setStatus(response.data.status);
    } catch (err) {
      console.warn('Failed to load backup status');
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/backup');
      setSuccess('Manual backup created successfully');
      loadBackups();
      loadStatus();
    } catch (err) {
      setError('Failed to create backup');
    }
    setLoading(false);
  };

  const restoreBackup = async (backupPath, location = 'local') => {
    const locationText = location === 'dropbox' ? 'cloud backup' : 'local backup';
    if (!window.confirm(`Are you sure? This will restore the database from this ${locationText}.`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/backup/restore', { 
        backupPath,
        location 
      });
      setSuccess(`Database restored successfully from ${locationText}`);
    } catch (err) {
      setError(`Failed to restore from ${locationText}`);
    }
    setLoading(false);
  };

  const uploadToCloud = async (backupPath, filename) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/backup/upload', { backupPath, filename });
      setSuccess('Backup uploaded to Dropbox successfully');
      loadBackups();
    } catch (err) {
      setError('Failed to upload to Dropbox');
    }
    setLoading(false);
  };

  const downloadFromCloud = async (remotePath, filename) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/backup/download', { remotePath, filename });
      setSuccess('Backup downloaded from Dropbox successfully');
      loadBackups();
    } catch (err) {
      setError('Failed to download from Dropbox');
    }
    setLoading(false);
  };

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type) => {
    const colors = {
      manual: 'primary',
      hourly: 'success',
      daily: 'info',
      weekly: 'warning',
      cloud: 'secondary'
    };
    return colors[type] || 'default';
  };

  const getLocationIcon = (location) => {
    return location === 'dropbox' ? <CloudIcon /> : <ComputerIcon />;
  };

  const isBackupInCloud = (localBackup) => {
    if (!backups.cloud || !Array.isArray(backups.cloud)) return false;
    
    // Extract the timestamp from the filename to match across types
    // Format: scheduling_app_TIMESTAMP_TYPE.sql
    const timestampMatch = localBackup.filename.match(/scheduling_app_(.+?)_(daily|manual|hourly|weekly)\.sql/);
    if (!timestampMatch) return false;
    
    const timestamp = timestampMatch[1];
    
    // Check if any cloud backup has the same timestamp
    return backups.cloud.some(cloudBackup => {
      const cloudTimestampMatch = cloudBackup.filename.match(/scheduling_app_(.+?)_(daily|manual|hourly|weekly)\.sql/);
      if (!cloudTimestampMatch) return false;
      
      const cloudTimestamp = cloudTimestampMatch[1];
      return cloudTimestamp === timestamp;
    });
  };

  // Prepare local backups (exclude cloud)
  const localBackups = Object.entries(backups || {})
    .filter(([type]) => type !== 'cloud')
    .flatMap(([type, items]) => 
      (items || []).map(item => ({ ...item, type, location: 'local' }))
    )
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  // Cloud backups
  const cloudBackups = (backups.cloud || [])
    .map(item => ({ ...item, type: 'cloud', location: 'dropbox' }))
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  // All backups combined for "All" tab
  const allBackups = [...localBackups, ...cloudBackups]
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  const renderBackupList = (backupList) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      );
    }

    if (backupList.length === 0) {
      return (
        <Typography color="textSecondary" align="center" sx={{ p: 2 }}>
          No backups found
        </Typography>
      );
    }

    return (
      <List>
        {backupList.map((backup, index) => (
          <ListItem 
            key={`${backup.type}-${backup.location}-${index}`} 
            divider
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  {getLocationIcon(backup.location)}
                  <Typography variant="body1">
                    {backup.filename}
                  </Typography>
                  <Chip 
                    label={backup.type} 
                    size="small" 
                    color={getTypeColor(backup.type)}
                  />
                  {backup.location === 'dropbox' && backup.type !== 'cloud' && (
                    <Chip 
                      label="Cloud" 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {formatDate(backup.created)} • {formatSize(backup.size)}
                  </Typography>
                </Box>
              }
            />
            <Box display="flex" gap={1}>
              {backup.location === 'local' && (backup.type === 'daily' || backup.type === 'manual') && status?.dropboxEnabled && !isBackupInCloud(backup) && (
                <Tooltip title="Upload to Dropbox">
                  <IconButton
                    onClick={() => uploadToCloud(backup.path, backup.filename)}
                    disabled={loading}
                    color="secondary"
                    size="small"
                  >
                    <CloudUploadIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              {backup.location === 'local' && (backup.type === 'daily' || backup.type === 'manual') && status?.dropboxEnabled && isBackupInCloud(backup) && (
                <Tooltip title="Already in Dropbox">
                  <IconButton
                    disabled
                    color="success"
                    size="small"
                  >
                    <CloudIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              {/*backup.location === 'dropbox' && (
                <Tooltip title="Download from Dropbox">
                  <IconButton
                    onClick={() => downloadFromCloud(backup.path, backup.filename)}
                    disabled={loading}
                    color="secondary"
                    size="small"
                  >
                    <CloudDownloadIcon />
                  </IconButton>
                </Tooltip>
              )*/}
              
              <Tooltip title={`Restore from ${backup.location === 'dropbox' ? 'cloud' : 'local'}`}>
                <IconButton
                  onClick={() => restoreBackup(backup.path, backup.location)}
                  disabled={loading}
                  color="primary"
                >
                  <RestoreIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Backup Management</Typography>
            {status && (
              <Typography variant="body2" color="textSecondary">
                {status.totalBackups} total backups • {status.dropboxEnabled ? 'Cloud enabled' : 'Local only'}
              </Typography>
            )}
          </Box>
          <Box>
            <IconButton onClick={() => { loadBackups(); loadStatus(); }} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <Button
              startIcon={<AddIcon />}
              onClick={createBackup}
              disabled={loading}
              variant="contained"
              size="small"
            >
              Create Manual Backup
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {status && !status.dropboxEnabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Cloud backup is disabled.
            </Typography>
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={`All (${allBackups.length})`} 
              icon={<ComputerIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={`Local (${localBackups.length})`} 
              icon={<ComputerIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={`Cloud (${cloudBackups.length})`} 
              icon={<CloudIcon />} 
              iconPosition="start"
              disabled={!status?.dropboxEnabled}
            />
          </Tabs>
        </Box>

        {tabValue === 0 && renderBackupList(allBackups)}
        {tabValue === 1 && renderBackupList(localBackups)}
        {tabValue === 2 && renderBackupList(cloudBackups)}
        
        {status && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Backup Summary</Typography>
            <Box display="flex" gap={3} flexWrap="wrap">
              <Typography variant="body2">
                Hourly: {status.byType.hourly}
              </Typography>
              <Typography variant="body2">
                Daily: {status.byType.daily}
              </Typography>
              <Typography variant="body2">
                Weekly: {status.byType.weekly}
              </Typography>
              <Typography variant="body2">
                Manual: {status.byType.manual}
              </Typography>
              {status.dropboxEnabled && (
                <Typography variant="body2">
                  Cloud: {status.byType.cloud}
                </Typography>
              )}
              <Typography variant="body2">
                Local Size: {formatSize(status.totalLocalSize)}
              </Typography>
            </Box>
            {status.lastBackup && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Last backup: {formatDate(status.lastBackup)}
              </Typography>
            )}
            {status.lastCloudBackup && (
              <Typography variant="body2" color="textSecondary">
                Last cloud backup: {formatDate(status.lastCloudBackup)}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BackupDialog;