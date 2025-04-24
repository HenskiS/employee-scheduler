import React from 'react';
import { Paper, Typography } from '@mui/material';

/**
 * Status card component for displaying summary information
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {number} props.value - Card value
 * @param {string} props.color - Background color of the card
 */
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

export default StatusCard;