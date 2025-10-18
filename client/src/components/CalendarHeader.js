import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, TextField, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

const CalendarHeader = ({ view, onViewChange, selectedDate, onDateChange }) => {
  const handleDateChange = (newDate) => {
    // Only call onDateChange if the date is valid
    if (moment.isMoment(newDate) && newDate.isValid()) {
      onDateChange(newDate.toDate());
    }
  };

  const handleViewChange = (_event, newView) => {
    // Prevent deselecting the current view (newView would be null)
    if (newView !== null) {
      onViewChange(newView);
    }
  };

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
          onChange={handleViewChange}
          aria-label="calendar view"
          size="small"
        >
          <ToggleButton value="jobs" aria-label="jobs view">
            Jobs
          </ToggleButton>
          <ToggleButton value="techs" aria-label="techs view">
            Techs
          </ToggleButton>
          <ToggleButton value="doctors" aria-label="doctors view">
            Doctors
          </ToggleButton>
        </ToggleButtonGroup>

        <DatePicker
          label="Select Date"
          value={moment(selectedDate)}
          onChange={handleDateChange}
          size="small"
          sx={{ width: 150 }}
          slotProps={{
            textField: {
              // Prevent invalid direct text input
              onKeyDown: (e) => {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                  e.stopPropagation();
                }
              }
            }
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarHeader;