import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import StatusCard from './StatusCard';

/**
 * Component for displaying email status summary with cards and progress bar
 * 
 * @param {Object} props - Component props
 * @param {Object} props.status - Status object containing progress information
 */
const EmailStatusSummary = ({ status }) => {
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!status) return 0;
    return (status.processed / status.totalTechnicians) * 100;
  };

  return (
    <>
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
    </>
  );
};

export default EmailStatusSummary;