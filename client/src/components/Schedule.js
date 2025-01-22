import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { 
  People as UsersIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import Calendar from './Calendar';
import PeopleDialog from './PeopleDialog';
import PrintDialog from './PrintDialog';
import PrintHandler from './PrintHandler';
import { useScheduling } from './SchedulingContext';

function Schedule() {
  const [tabValue, setTabValue] = useState(0);
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintCalendarOpen, setIsPrintCalendarOpen] = useState(false);
  const [filterParams, setFilterParams] = useState();
  
  const { events, updateDateRange } = useScheduling();
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Filter events when either events or filterParams change
  useEffect(() => {
    if (filterParams && events.length) {
      const filtered = events.filter(event => {
        const hasMatchingLabel = !filterParams.labels.length || 
          filterParams.labels.map(l => l.value).includes(event.label);
        const hasMatchingDoctor = !filterParams.doctors.length || 
          filterParams.doctors.map(d => d.id).includes(event.Doctor?.id);
        const hasMatchingTechnician = !filterParams.technicians.length || 
          event.Technicians.some(tech => 
            filterParams.technicians.map(t => t.id).includes(tech.id)
          );

        return hasMatchingLabel && hasMatchingDoctor && hasMatchingTechnician;
      });
      
      setFilteredEvents(filtered);
    }
  }, [events, filterParams]);

  // Open print calendar when we have filtered events
  useEffect(() => {
    if (filteredEvents.length) {
      setIsPrintCalendarOpen(true);
    }
  }, [filteredEvents]);

  const handleOpenPeopleDialog = () => {
    setIsPeopleDialogOpen(true);
  };

  const handleClosePeopleDialog = () => {
    setIsPeopleDialogOpen(false);
  };

  const handleOpenPrintDialog = () => {
    setIsPrintDialogOpen(true);
  };

  const handleClosePrintDialog = () => {
    setIsPrintDialogOpen(false);
  };

  const handleClosePrintCalendar = () => {
    setIsPrintCalendarOpen(false);
  };

  const handlePrint = (params) => {
    // Update the date range in context
    updateDateRange(params.startDate, params.endDate);
    setFilterParams(params);
  };

  return (
    isPrintCalendarOpen ? (
      <PrintHandler
        events={filteredEvents}
        view={filterParams.view}
        dateRange={{start: filterParams.startDate, end: filterParams.endDate}}
        close={handleClosePrintCalendar}
        filterParams={filterParams}
      />
    ) : (
      <div>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0 }}>
          <Button startIcon={<UsersIcon />} onClick={handleOpenPeopleDialog}>
            People
          </Button>
          <Button startIcon={<UsersIcon />} onClick={handleOpenPrintDialog}>
            Print
          </Button>
          <PeopleDialog open={isPeopleDialogOpen} onClose={handleClosePeopleDialog} />
          <PrintDialog 
            open={isPrintDialogOpen} 
            onClose={handleClosePrintDialog} 
            onPrint={handlePrint}
          />
          <Button startIcon={<SettingsIcon />}>Settings</Button>
        </Box>
        <Box mt={2}>
          {tabValue === 0 && <Calendar view="jobs" />}
          {tabValue === 1 && <Calendar view="techs" />}
        </Box>
      </div>
    )
  );
}

export default Schedule;