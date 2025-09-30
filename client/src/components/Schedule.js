import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import {
  People as UsersIcon,
  Settings as SettingsIcon,
  Print as PrintIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import Calendar from './Calendar';
import PeopleDialog from './PeopleDialog';
import PrintDialog from './PrintDialog';
import EmailScheduleDialog from './email/EmailScheduleDialog';
import EmailStatusDialog from './email/EmailStatusDialog';
import BackupDialog from './BackupDialog';
import PrintHandler from './PrintHandler';
import { useScheduling } from './SchedulingContext';
import axios from '../api/axios'

function Schedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(0);
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isEmailStatusDialogOpen, setIsEmailStatusDialogOpen] = useState(false);
  const [shouldResetPrintDialog, setShouldResetPrintDialog] = useState(false);
  const [isPrintCalendarOpen, setIsPrintCalendarOpen] = useState(false);
  const [filterParams, setFilterParams] = useState();
  const [emailStatusId, setEmailStatusId] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [showAlert, setShowAlert] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  
  const { events, updateDateRange, fetchFilteredEvents } = useScheduling();
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Check for URL parameters to open print dialog
  useEffect(() => {
    if (searchParams.get('openPrintDialog') === 'true') {
      setIsPrintDialogOpen(true);
      // Clean up the URL parameter
      searchParams.delete('openPrintDialog');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch filtered events when filterParams change
  useEffect(() => {
    if (filterParams) {
      const fetchFiltered = async () => {
        try {
          let filters = {};

          // For email functionality - handle includeAllEvents
          if (filterParams.source === 'email') {
            if (!filterParams.includeAllEvents && filterParams.technicians?.length > 0) {
              filters.technicians = filterParams.technicians;
            }
          } else {
            // For print functionality - apply all filters
            if (filterParams.labels?.length > 0) {
              filters.labels = filterParams.labels;
            }
            if (filterParams.doctors?.length > 0) {
              filters.doctors = filterParams.doctors;
            }
            if (filterParams.technicians?.length > 0) {
              filters.technicians = filterParams.technicians;
            }
          }

          const filtered = await fetchFilteredEvents(
            filterParams.startDate,
            filterParams.endDate,
            filters
          );
          setFilteredEvents(filtered);
        } catch (error) {
          console.error('Error fetching filtered events:', error);
          setFilteredEvents([]);
        }
      };

      fetchFiltered();
    }
  }, [filterParams, fetchFilteredEvents]);

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

  const handleCloseEmailStatusDialog = () => {
    setIsEmailStatusDialogOpen(false);
    setEmailStatusId(null);
  };

  const handleClosePrintCalendar = () => {
    setIsPrintCalendarOpen(false);
    setFilterParams(null);
    setIsPrintDialogOpen(false);
    setShouldResetPrintDialog(true);
  };

  const handlePrint = (params) => {
    // This function is kept for backward compatibility but is no longer used
    // The PrintDialog now navigates directly to /print-preview
    console.log('handlePrint called (deprecated):', params);
  };

  const handleSendEmail = (params) => {
    console.log('Sending email with parameters:', params);
    setIsEmailDialogOpen(false);

    axios.post('/schedules/send-emails', params)
      .then(response => {
        console.log('Email sending process started:', response.data);
        
        // Show success alert
        setAlertMessage('Email sending process started');
        setAlertSeverity('info');
        setShowAlert(true);
        
        // Open the status dialog with the returned ID
        if (response.data && response.data.id) {
          setEmailStatusId(response.data.id);
          setIsEmailStatusDialogOpen(true);
        }
      })
      .catch(error => {
        console.error('Error sending email:', error);
        
        // Show error alert
        setAlertMessage(error.response?.data?.error || 'Error sending emails');
        setAlertSeverity('error');
        setShowAlert(true);
      });
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowAlert(false);
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
            <Button startIcon={<PrintIcon />} onClick={handleOpenPrintDialog}>
              Print
            </Button>
            <Button startIcon={<EmailIcon />} onClick={handleOpenEmailDialog}>
              Email Schedules
            </Button>
            <Button startIcon={<SettingsIcon />} onClick={() => setIsBackupDialogOpen(true)}>
              Backup
            </Button>
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
      <EmailStatusDialog
        open={isEmailStatusDialogOpen}
        onClose={handleCloseEmailStatusDialog}
        statusId={emailStatusId}
      />
      <BackupDialog 
        open={isBackupDialogOpen} 
        onClose={() => setIsBackupDialogOpen(false)} 
      />
      
      <Snackbar 
        open={showAlert} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alertSeverity} 
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Schedule;