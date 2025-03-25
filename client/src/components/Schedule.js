import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { 
  People as UsersIcon,
  Settings as SettingsIcon,
  Print as PrintIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import Calendar from './Calendar';
import PeopleDialog from './PeopleDialog';
import PrintDialog from './PrintDialog';
import EmailScheduleDialog from './EmailScheduleDialog';
import PrintHandler from './PrintHandler';
import { useScheduling } from './SchedulingContext';

function Schedule() {
  const [tabValue, setTabValue] = useState(0);
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [shouldResetPrintDialog, setShouldResetPrintDialog] = useState(false);
  const [isPrintCalendarOpen, setIsPrintCalendarOpen] = useState(false);
  const [filterParams, setFilterParams] = useState();
  
  const { events, updateDateRange } = useScheduling();
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Filter events when either events or filterParams change
  useEffect(() => {
    if (filterParams && events.length) {
      const filtered = events.filter(event => {
        // Start with date range filtering (always applied)
        const startDate = new Date(filterParams.startDate);
        const endDate = new Date(filterParams.endDate);
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const isWithinDateRange = eventStart >= startDate && eventEnd <= endDate;
        
        if (!isWithinDateRange) return false;
        
        // For email functionality - optional filtering
        if (filterParams.source === 'email') {
          // If includeAllEvents is true, keep all events within date range
          if (filterParams.includeAllEvents) return true;
          
          // Otherwise, only include events assigned to selected technicians
          return event.Technicians.some(tech => 
            filterParams.technicians.map(t => t.id).includes(tech.id)
          );
        }
        
        // For print functionality - standard filtering
        const hasMatchingLabel = !filterParams.labels?.length || 
          filterParams.labels.map(l => l.value).includes(event.label);
        const hasMatchingDoctor = !filterParams.doctors?.length || 
          filterParams.doctors.map(d => d.id).includes(event.Doctor?.id);
        const hasMatchingTechnician = !filterParams.technicians?.length || 
          event.Technicians.some(tech => 
            filterParams.technicians.map(t => t.id).includes(tech.id)
          );

        return hasMatchingLabel && hasMatchingDoctor && hasMatchingTechnician;
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

  const handleOpenEmailDialog = () => {
    setIsEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setIsEmailDialogOpen(false);
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
    setFilterParams({
      ...params,
      source: 'print'
    });
    setIsPrintCalendarOpen(true);
    setIsPrintDialogOpen(false);
  };

  const handleSendEmail = (params) => {
    console.log('Sending email with parameters:', params);
    
    setFilterParams({
      ...params,
      source: 'email'
    });
    
    // Implement POST request to server
    // Show success/error message, maybe email the error to the user?
    
    // For now, just log and close the dialog
    setIsEmailDialogOpen(false);
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
            <Box>
              <Button startIcon={<UsersIcon />} onClick={handleOpenPeopleDialog}>
                People
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button startIcon={<PrintIcon />} onClick={handleOpenPrintDialog}>
                Print
              </Button>
              <Button startIcon={<EmailIcon />} onClick={handleOpenEmailDialog}>
                Email Schedules
              </Button>
            </Box>
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
      <EmailScheduleDialog
        open={isEmailDialogOpen}
        onClose={handleCloseEmailDialog}
        onSend={handleSendEmail}
      />
    </>
  );
}

export default Schedule;