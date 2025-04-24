import React from 'react';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Cached as ProcessingIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';

/**
 * Returns the appropriate icon component based on status
 * 
 * @param {string} techStatus - Status string (pending, processing, completed, failed)
 * @returns {JSX.Element} Icon component with appropriate color
 */
export const getStatusIcon = (techStatus) => {
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