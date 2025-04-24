import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useScheduling } from '../SchedulingContext';
import EmailDateRangePicker from './EmailDateRangePicker';
import TechnicianSelector from './TechnicianSelector';
import EmailOptionsForm from './EmailOptionsForm';
import { validateEmails } from './ValidationUtils';

const EmailScheduleDialog = ({ open, onClose, onSend }) => {
  const { technicians } = useScheduling();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [technicianOption, setTechnicianOption] = useState('allActive');
  const [dateError, setDateError] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Your Schedule');
  const [emailMessage, setEmailMessage] = useState('Attached is your schedule for the upcoming period.');
  const [includeAllEvents, setIncludeAllEvents] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sending, setSending] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // One-time initialization when dialog opens
  useEffect(() => {
    if (open && !isInitialized) {
      // Set default values when first opened
      setEmailSubject('Your Schedule');
      setEmailMessage('Attached is your schedule for the upcoming period.');
      setIncludeAllEvents(true);
      setDateError(false);
      setValidationErrors([]);
      setSending(false);
      
      // Only reset dates if they aren't already set
      if (!startDate && !endDate) {
        setStartDate(null);
        setEndDate(null);
      }
      
      // Initial technician option and selection
      setTechnicianOption('allActive');
      const activeTechs = technicians.filter(tech => tech.isActive);
      setSelectedTechnicians(activeTechs);
      
      setIsInitialized(true);
    } else if (!open) {
      // Reset when dialog closes
      setIsInitialized(false);
      setSending(false);
    }
  }, [open, technicians, startDate, endDate]);

  const handleTechnicianOptionChange = (newOption) => {
    setTechnicianOption(newOption);
    
    // Update the selection based on the new option
    if (newOption === 'allActive') {
      const activeTechs = technicians.filter(tech => tech.isActive);
      setSelectedTechnicians(activeTechs);
    } else if (newOption === 'all') {
      setSelectedTechnicians([...technicians]);
    } else if (newOption === 'selected' && selectedTechnicians.length === 0) {
      // If switching to 'selected' but no techs are selected, don't change the selection
      setSelectedTechnicians([]);
    }
  };

  const handleSend = () => {
    // Clear previous errors
    setDateError(false);
    setValidationErrors([]);
    
    // Collect all validation errors
    let hasErrors = false;
    const errors = [];
    
    // Check if both dates are selected
    if (!startDate || !endDate) {
      setDateError('Please select both start and end dates');
      hasErrors = true;
    } else {
      // Check if dates are valid
      if (!startDate.isValid() || !endDate.isValid()) {
        setDateError('Invalid date format');
        hasErrors = true;
      } else if (startDate.isAfter(endDate)) {
        // Check date order
        setDateError('Start date must be before end date');
        hasErrors = true;
      }
    }

    // Check if at least one technician is selected
    if (selectedTechnicians.length === 0) {
      errors.push('Please select at least one technician');
      hasErrors = true;
    } else {
      // Validate email addresses
      const emailErrors = validateEmails(selectedTechnicians);
      if (emailErrors.length > 0) {
        errors.push(...emailErrors);
        hasErrors = true;
      }
    }
    
    // Update validation errors
    if (errors.length > 0) {
      setValidationErrors(errors);
    }
    
    if (hasErrors) {
      return;
    }
    
    // Set sending state to true to show loading indicator
    setSending(true);
    
    const emailParams = {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      technicians: selectedTechnicians,
      emailSubject,
      emailMessage,
      includeAllEvents,
      // Always use agenda view for emails
      view: 'agenda'
    };

    onSend(emailParams);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DialogTitle>Email Technician Schedules</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, my: 1 }}>
            {/* Date Range Picker Component */}
            <EmailDateRangePicker
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setDateError={setDateError}
            />

            {dateError && (
              <Alert severity="error" onClose={() => setDateError(false)}>
                {dateError}
              </Alert>
            )}
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Please fix the following issues:</Typography>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Technician Selector Component */}
            <TechnicianSelector
              technicians={technicians}
              selectedTechnicians={selectedTechnicians}
              setSelectedTechnicians={setSelectedTechnicians}
              technicianOption={technicianOption}
              onTechnicianOptionChange={handleTechnicianOptionChange}
            />

            {/* Email Options Form Component */}
            <EmailOptionsForm
              emailSubject={emailSubject}
              setEmailSubject={setEmailSubject}
              emailMessage={emailMessage}
              setEmailMessage={setEmailMessage}
              includeAllEvents={includeAllEvents}
              setIncludeAllEvents={setIncludeAllEvents}
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

export default EmailScheduleDialog;