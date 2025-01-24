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
  const [shouldResetPrintDialog, setShouldResetPrintDialog] = useState(false);
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
        // Add date range filtering
        const startDate = new Date(filterParams.startDate);
        const endDate = new Date(filterParams.endDate);
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        const isWithinDateRange = eventStart >= startDate && eventEnd <= endDate;

        return hasMatchingLabel && hasMatchingDoctor && hasMatchingTechnician && isWithinDateRange;
      });
      
      setFilteredEvents(filtered);
    }
  }, [events, filterParams]);

  const handleOpenPeopleDialog = () => {
    setIsPeopleDialogOpen(true);
  };

  const handleClosePeopleDialog = () => {
    setIsPeopleDialogOpen(false);
  };

  const handleOpenPrintDialog = () => {
    if (isPrintCalendarOpen) {
      setShouldResetPrintDialog(false);
    }
    setIsPrintDialogOpen(true);
  };

  const handleClosePrintDialog = () => {
    setIsPrintDialogOpen(false);
  };

  const handleClosePrintCalendar = () => {
    setIsPrintCalendarOpen(false);
    setFilterParams(null);
    setIsPrintDialogOpen(false);
    setShouldResetPrintDialog(true);
  };

  const handlePrint = (params) => {
    // Update the date range in context
    updateDateRange(params.startDate, params.endDate);
    setFilterParams(params);
    setIsPrintCalendarOpen(true);
    setIsPrintDialogOpen(false);
  };

  return (
    <>
      {isPrintCalendarOpen ? (
        <PrintHandler
          events={filteredEvents}
          view={filterParams.view}
          dateRange={{start: filterParams.startDate, end: filterParams.endDate}}
          close={handleClosePrintCalendar}
          filterParams={filterParams}
          onEdit={() => setIsPrintDialogOpen(true)}
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
            <Button startIcon={<SettingsIcon />}>Settings</Button>
          </Box>
          <Box mt={2}>
            {tabValue === 0 && <Calendar view="jobs" />}
            {tabValue === 1 && <Calendar view="techs" />}
          </Box>
        </div>
      )}
      
      <PeopleDialog 
        open={isPeopleDialogOpen} 
        onClose={handleClosePeopleDialog} 
      />
      <PrintDialog 
        open={isPrintDialogOpen} 
        onClose={handleClosePrintDialog}
        onPrint={handlePrint}
        shouldReset={shouldResetPrintDialog}
      />
    </>
  );
}

export default Schedule;