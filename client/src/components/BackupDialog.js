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
  CircularProgress
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from '../api/axios';

function BackupDialog({ open, onClose }) {
  const [backups, setBackups] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      loadBackups();
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

  const createBackup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/backup');
      setSuccess('Backup created successfully');
      loadBackups();
    } catch (err) {
      setError('Failed to create backup');
    }
    setLoading(false);
  };

  const restoreBackup = async (backupPath) => {
    if (!window.confirm('Are you sure? This will restore the database to this backup.')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/backup/restore', { backupPath });
      setSuccess('Backup restored successfully');
    } catch (err) {
      setError('Failed to restore backup');
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
      weekly: 'warning'
    };
    return colors[type] || 'default';
  };
  const allBackups = Object.entries(backups || {})
    .flatMap(([type, items]) => 
      (items || []).map(item => ({ ...item, type }))
    )
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Backup Management
          <Box>
            <IconButton onClick={loadBackups} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <Button
              startIcon={<AddIcon />}
              onClick={createBackup}
              disabled={loading}
              variant="contained"
              size="small"
            >
              Create Backup
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {loading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && allBackups.length === 0 && (
          <Typography color="textSecondary" align="center">
            No backups found
          </Typography>
        )}
        
        {!loading && allBackups.length > 0 && (
          <List>
            {allBackups.map((backup, index) => (
              <ListItem 
                key={`${backup.type}-${index}`} 
                divider
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {backup.filename}
                      </Typography>
                      <Chip 
                        label={backup.type} 
                        size="small" 
                        color={getTypeColor(backup.type)}
                      />
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
                <IconButton
                  onClick={() => restoreBackup(backup.path)}
                  disabled={loading}
                  color="primary"
                >
                  <RestoreIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BackupDialog;