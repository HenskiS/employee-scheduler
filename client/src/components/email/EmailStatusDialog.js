import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from '../../api/axios';
import EmailStatusSummary from './EmailStatusSummary';
import EmailStatusTable from './EmailStatusTable';

const EmailStatusDialog = ({ open, onClose, statusId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    if (!statusId) return;
    
    try {
      setRefreshing(true);
      const response = await axios.get(`/schedules/email-status/${statusId}`);
      setStatus(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch status');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    if (!open || !statusId) return;
    
    setLoading(true);
    fetchStatus();
    
    // Set up polling every 2 seconds, but only if not all emails are processed yet
    let intervalId;
    
    if (!status || status.processed < status.totalTechnicians) {
      intervalId = setInterval(fetchStatus, 2000);
    }
    
    // Clean up
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [open, statusId, status?.processed, status?.totalTechnicians]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setStatus(null);
      setLoading(true);
      setError(null);
    }
  }, [open]);
  
  const handleManualRefresh = () => {
    fetchStatus();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Email Sending Status</Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && !status ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading status information...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
            <Typography color="error" variant="body1">
              Error: {error}
            </Typography>
          </Box>
        ) : status ? (
          <Box>
            {/* Email Status Summary Component */}
            <EmailStatusSummary status={status} />
            
            {/* Manual Refresh Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Tooltip title="Refresh Status">
                <IconButton 
                  onClick={handleManualRefresh} 
                  disabled={refreshing}
                  color="primary"
                  size="small"
                >
                  {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Email Status Table Component */}
            <Typography variant="h6" sx={{ mb: 1 }}>Email Details</Typography>
            <EmailStatusTable technicianStatus={status.technicianStatus} />
          </Box>
        ) : null}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailStatusDialog;