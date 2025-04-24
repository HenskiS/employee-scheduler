import React from 'react';
import { Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';

const EmailDateRangePicker = ({ startDate, endDate, setStartDate, setEndDate, setDateError }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <DatePicker
        label="Start Date"
        value={startDate}
        onChange={(date) => {
          setStartDate(date);
          setDateError(false);
        }}
        slotProps={{ 
          textField: { 
            fullWidth: true,
          } 
        }}
      />
      <DatePicker
        label="End Date"
        value={endDate}
        onChange={(date) => {
          setEndDate(date);
          setDateError(false);
        }}
        slotProps={{ 
          textField: { 
            fullWidth: true,
          } 
        }}
      />
    </Box>
  );
};

export default EmailDateRangePicker;