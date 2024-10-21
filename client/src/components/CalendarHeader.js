import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, TextField, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

const CalendarHeader = ({ view, onViewChange, selectedDate, onDateChange }) => {

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        padding: "8px 0px", 
        borderRadius: 1
      }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(event, newView) => onViewChange(newView)}
          aria-label="calendar view"
          size="small"
        >
          <ToggleButton value="jobs" aria-label="jobs view">
            Jobs
          </ToggleButton>
          <ToggleButton value="techs" aria-label="techs view">
            Techs
          </ToggleButton>
        </ToggleButtonGroup>

        <DatePicker
          label="Select Date"
          value={moment(selectedDate)}
          onChange={(newDate) => onDateChange(newDate.toDate())}
          renderInput={(params) => <TextField {...params} size="small" sx={{ width: 150 }} />}
        />

      </Box>
    </LocalizationProvider>
  );
};

export default CalendarHeader;