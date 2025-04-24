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
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Cached as ProcessingIcon,
  Close as CloseIcon,
  HourglassEmpty as PendingIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from '../api/axios';

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

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!status) return 0;
    return (status.processed / status.totalTechnicians) * 100;
  };

  // Get status icon based on status
  const getStatusIcon = (techStatus) => {
    switch (techStatus) {
      case 'pending':
        return <PendingIcon sx={{ color: '#9e9e9e' }} />;
      case 'processing':
        return <ProcessingIcon sx={{ color: '#2196f3' }} />;
      case 'completed':
        return <SuccessIcon sx={{ color: '#4caf50' }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      default:
        return null;
    }
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
            {/* Summary Cards */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              justifyContent: 'space-between',
              mb: 3 
            }}>
              <StatusCard 
                title="Total" 
                value={status.totalTechnicians} 
                color="#e0e0e0" 
              />
              <StatusCard 
                title="Processed" 
                value={status.processed} 
                color="#e3f2fd" 
              />
              <StatusCard 
                title="Succeeded" 
                value={status.succeeded} 
                color="#e8f5e9" 
              />
              <StatusCard 
                title="Failed" 
                value={status.failed} 
                color="#ffebee" 
              />
              <StatusCard 
                title="In Progress" 
                value={status.inProgress} 
                color="#ede7f6" 
              />
            </Box>
            
            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Progress: {status.processed} of {status.totalTechnicians} emails
                </Typography>
                <Typography variant="body2">
                  {Math.round(getProgressPercentage())}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getProgressPercentage()} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            
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
            
            {/* Technician Details Table */}
            <Typography variant="h6" sx={{ mb: 1 }}>Email Details</Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="5%">Status</TableCell>
                    <TableCell>Technician</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {status.technicianStatus.map((tech) => (
                    <TableRow 
                      key={tech.technicianId}
                      sx={{ 
                        '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                        backgroundColor: tech.status === 'failed' 
                          ? 'rgba(244, 67, 54, 0.1)' 
                          : tech.status === 'completed'
                            ? 'rgba(76, 175, 80, 0.1)'
                            : tech.status === 'processing'
                              ? 'rgba(33, 150, 243, 0.1)'
                              : undefined
                      }}
                    >
                      <TableCell>
                        {getStatusIcon(tech.status)}
                      </TableCell>
                      <TableCell>
                        {tech.details?.technicianName || `Technician ${tech.technicianId}`}
                      </TableCell>
                      <TableCell>
                        {tech.status === 'pending' && 'Waiting to process...'}
                        {tech.status === 'processing' && 'Generating and sending email...'}
                        {tech.status === 'completed' && (
                          <Typography variant="body2" color="success.main">
                            Email sent successfully
                            {tech.details?.messageId && 
                              ` (ID: ${tech.details.messageId.substring(0, 8)}...)`
                            }
                          </Typography>
                        )}
                        {tech.status === 'failed' && (
                          <Typography variant="body2" color="error">
                            {tech.details?.error || 'Failed to send email'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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

// Helper component for status cards
const StatusCard = ({ title, value, color }) => (
  <Paper 
    elevation={1} 
    sx={{ 
      p: 2, 
      minWidth: '18%', 
      backgroundColor: color,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <Typography variant="body2" color="text.secondary" align="center">
      {title}
    </Typography>
    <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
      {value}
    </Typography>
  </Paper>
);

export default EmailStatusDialog;