import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  ListItemText, 
  Box, 
  Alert,
  TextField,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  ListSubheader,
  CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useScheduling } from './SchedulingContext';

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

  // Only update selection when option changes by user
  const handleTechnicianOptionChange = (e) => {
    const newOption = e.target.value;
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

  const handleTechnicianSelectionChange = (e) => {
    const newSelection = e.target.value;
    setSelectedTechnicians(newSelection);
    // Radio buttons only change when explicitly clicked by the user
  };

  // Validate email addresses in selected technicians
  const validateEmails = (techs) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    techs.forEach(tech => {
      if (!tech.email || !emailRegex.test(tech.email)) {
        errors.push(`${tech.name || 'Technician ' + tech.id}: Invalid or missing email (${tech.email || 'none'})`);
      }
    });
    
    return errors;
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

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 48 * 4.5 + 8,
        width: 250,
      },
    },
    // Force menu to always open at the top of the list
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left',
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'left',
    },
    // Ensure first item is visible/scrolled to
    disableAutoFocusItem: true,
  };

  // Sort technicians: active first, then inactive
  const sortedTechnicians = [...technicians].sort((a, b) => {
    // First sort by active status (active first)
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    
    // If same active status, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DialogTitle>Email Technician Schedules</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, my: 1 }}>
            {/* Date Range Selectors */}
            <Box sx={{ display: 'flex' , gap: 1 }}>
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

            {/* Technician Options */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Technicians</Typography>
              
              <RadioGroup
                value={technicianOption}
                onChange={handleTechnicianOptionChange}
              >
                <FormControlLabel 
                  value="allActive" 
                  control={<Radio />} 
                  label="All Active Technicians" 
                />
                <FormControlLabel 
                  value="all" 
                  control={<Radio />} 
                  label="All Technicians" 
                />
                <FormControlLabel 
                  value="selected" 
                  control={<Radio />} 
                  label="Selected Technicians" 
                />
              </RadioGroup>
              
              {technicianOption === 'selected' && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Select individual technicians below:
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => {
                        setSelectedTechnicians([]);
                      }}
                      variant="outlined"
                    >
                      Clear Selection
                    </Button>
                  </Box>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select Technicians</InputLabel>
                    <Select
                      multiple
                      value={selectedTechnicians}
                      onChange={handleTechnicianSelectionChange}
                      renderValue={(selected) => selected.map(tech => tech.name).join(', ')}
                      label="Select Technicians"
                      MenuProps={MenuProps}
                    >
                      {/* Active Technicians */}
                      <ListSubheader>Active Technicians</ListSubheader>
                      {sortedTechnicians.filter(tech => tech.isActive).map((technician) => (
                        <MenuItem key={technician.name} value={technician}>
                          <Checkbox checked={selectedTechnicians.some(tech => tech.name === technician.name)} />
                          <ListItemText 
                            primary={technician.name} 
                            secondary={technician.email || 'No email'} 
                          />
                        </MenuItem>
                      ))}
                      
                      {/* Divider between active and inactive */}
                      {sortedTechnicians.some(tech => !tech.isActive) && (
                        <ListSubheader>Inactive Technicians</ListSubheader>
                      )}
                      
                      {/* Inactive Technicians */}
                      {sortedTechnicians.filter(tech => !tech.isActive).map((technician) => (
                        <MenuItem key={technician.name} value={technician} sx={{ opacity: 0.7 }}>
                          <Checkbox checked={selectedTechnicians.some(tech => tech.name === technician.name)} />
                          <ListItemText 
                            primary={technician.name} 
                            primaryTypographyProps={{ 
                              sx: { fontStyle: 'italic' } 
                            }}
                            secondary={technician.email || 'No email'}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>

            {/* Email Options */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Email Options</Typography>
              
              <TextField
                fullWidth
                label="Email Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Email Message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                margin="normal"
                variant="outlined"
                multiline
                rows={3}
              />
              
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeAllEvents}
                      onChange={() => setIncludeAllEvents(!includeAllEvents)}
                    />
                  }
                  label="Include events for All"
                />
              </Box>
            </Box>
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