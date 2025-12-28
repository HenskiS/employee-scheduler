import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useScheduling } from '../SchedulingContext';
import RecipientSelector from './RecipientSelector';
import EmailOptionsForm from './EmailOptionsForm';

const EmailPrintDialog = ({ open, onClose, onSend, filterParams }) => {
  const { doctors, technicians, users } = useScheduling();
  const [selectedRecipients, setSelectedRecipients] = useState({
    doctors: [],
    technicians: [],
    users: [],
    customEmails: []
  });
  const [emailSubject, setEmailSubject] = useState('Schedule');
  const [emailMessage, setEmailMessage] = useState('Please find attached the schedule for the selected period.');
  const [sending, setSending] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setSelectedRecipients({ doctors: [], technicians: [], users: [], customEmails: [] });
      setEmailSubject('Schedule');
      setEmailMessage('Please find attached the schedule for the selected period.');
      setValidationErrors([]);
      setSending(false);
    }
  }, [open]);

  const handleSend = () => {
    // Clear previous errors
    setValidationErrors([]);

    // Validation
    const errors = [];

    // Check if at least one recipient is selected
    const totalRecipients =
      selectedRecipients.doctors.reduce((sum, d) => sum + d.selectedEmails.length, 0) +
      selectedRecipients.technicians.length +
      selectedRecipients.users.length +
      selectedRecipients.customEmails.length;

    if (totalRecipients === 0) {
      errors.push('Please select at least one recipient');
    }

    // Validate doctor emails
    selectedRecipients.doctors.forEach(doctor => {
      if (doctor.selectedEmails.length === 0) {
        errors.push(`Doctor "${doctor.customer}" has no emails selected`);
      }
    });

    // Validate technician emails
    selectedRecipients.technicians.forEach(tech => {
      if (!tech.email) {
        errors.push(`Technician "${tech.name}" has no email address`);
      }
    });

    // Validate user emails
    selectedRecipients.users.forEach(user => {
      if (!user.email) {
        errors.push(`User "${user.name}" has no email address`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Set sending state
    setSending(true);

    // Prepare email parameters
    const emailParams = {
      startDate: filterParams.startDate,
      endDate: filterParams.endDate,
      view: filterParams.view,
      labels: filterParams.labels,
      doctors: filterParams.doctors,
      technicians: filterParams.technicians,
      displayOptions: filterParams.displayOptions,
      customHeader: filterParams.customHeader,
      recipients: selectedRecipients,
      emailSubject,
      emailMessage
    };

    onSend(emailParams);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DialogTitle>Email Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
            {/* Recipient Selector */}
            <RecipientSelector
              doctors={doctors}
              technicians={technicians}
              users={users}
              selectedRecipients={selectedRecipients}
              setSelectedRecipients={setSelectedRecipients}
              validationErrors={validationErrors}
            />

            {/* Email Options (reuse existing component) */}
            <EmailOptionsForm
              emailSubject={emailSubject}
              setEmailSubject={setEmailSubject}
              emailMessage={emailMessage}
              setEmailMessage={setEmailMessage}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={sending}>Cancel</Button>
          <Button
            onClick={handleSend}
            variant="contained"
            color="primary"
            disabled={sending}
            startIcon={sending && <CircularProgress size={18} color="inherit" />}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </Dialog>
  );
};

export default EmailPrintDialog;
