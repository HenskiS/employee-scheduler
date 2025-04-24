import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { getStatusIcon } from './StatusIcons';

/**
 * Table component for displaying detailed email status information
 * 
 * @param {Object} props - Component props
 * @param {Array} props.technicianStatus - Array of technician status objects
 */
const EmailStatusTable = ({ technicianStatus }) => {
  return (
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
          {technicianStatus.map((tech) => (
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
  );
};

export default EmailStatusTable;