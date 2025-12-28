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
 * @param {Array} props.technicianStatus - Array of recipient status objects
 */
const EmailStatusTable = ({ technicianStatus }) => {
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell width="5%">Status</TableCell>
            <TableCell>Recipient</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {technicianStatus.map((recipient) => (
            <TableRow
              key={recipient.recipientId || recipient.technicianId}
              sx={{
                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                backgroundColor: recipient.status === 'failed'
                  ? 'rgba(244, 67, 54, 0.1)'
                  : recipient.status === 'completed'
                    ? 'rgba(76, 175, 80, 0.1)'
                    : recipient.status === 'processing'
                      ? 'rgba(33, 150, 243, 0.1)'
                      : undefined
              }}
            >
              <TableCell>
                {getStatusIcon(recipient.status)}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {recipient.email || recipient.details?.technicianName || recipient.recipientName || `Recipient ${recipient.recipientId || recipient.technicianId}`}
                </Typography>
                {recipient.email && (recipient.recipientName || recipient.details?.technicianName) && (
                  <Typography variant="caption" color="text.secondary">
                    {recipient.recipientName || recipient.details?.technicianName}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {recipient.status === 'pending' && 'Waiting to process...'}
                {recipient.status === 'processing' && 'Generating and sending email...'}
                {recipient.status === 'completed' && (
                  <Typography variant="body2" color="success.main">
                    Email sent successfully
                    {recipient.details?.messageId &&
                      ` (ID: ${recipient.details.messageId.substring(0, 8)}...)`
                    }
                  </Typography>
                )}
                {recipient.status === 'failed' && (
                  <Typography variant="body2" color="error">
                    {recipient.details?.error || 'Failed to send email'}
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