import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  FormHelperText,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { useScheduling } from './SchedulingContext';
import RecurringEventForm from './RecurringEventForm';
import TechnicianSelector from './TechnicianSelector';
import RecurringEventChoiceDialog from './RecurringEventChoiceDialog';

function EventDialog({ 
  open, 
  onClose, 
  event, 
  onSave, 
  onDelete, 
  newEvent, 
  conflictError, 
  onClearConflicts 
}) {
  const { technicians, doctors, labels, throughThirty } = useScheduling();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: moment(),
    endTime: moment().add(4, 'hour'),
    allDay: false,
    label: 'none',
    jobNumber: '',
    isRecurring: false,
    recurrencePattern: null,
    Technicians: [],
    DoctorId: null
  });

  const [errors, setErrors] = useState({
    name: '',
    startTime: '',
    endTime: '',
    jobNumber: ''
  });
  const [showRecurringChoice, setShowRecurringChoice] = useState(false);
  const [recurringAction, setRecurringAction] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    if (event) {
      // Handle loading existing event
      if (event.forAll) {
        // If the event is for all technicians, set a special "All Technicians" option
        setFormData({
          ...event,
          startTime: moment(event.startTime),
          endTime: moment(event.endTime),
          label: event.label ?? 'None',
          Technicians: [{ id: 'all', name: 'All Technicians', isAllOption: true }]
        });
      } else {
        // Regular event with specific technicians
        setFormData({
          ...event,
          startTime: moment(event.startTime),
          endTime: moment(event.endTime),
          label: event.label ?? 'None'
        });
      }
      
      // Clear errors when editing existing event
      setErrors({
        name: '',
        startTime: '',
        endTime: '',
        jobNumber: ''
      });
    } else if (newEvent) {
      setFormData({
        ...formData,
        startTime: moment(newEvent.start),
        endTime: moment(newEvent.end),
        jobNumber: newEvent.resourceId,
        allDay: newEvent.allDay,
      });
    }
  }, [event, newEvent]);

  // Show conflicts when they are received
  useEffect(() => {
    if (conflictError) {
      setShowConflicts(true);
    }
  }, [conflictError]);

  const validateForm = () => {
    const newErrors = {
      name: '',
      startTime: '',
      endTime: '',
      jobNumber: ''
    };
    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Validate job number
    if (!formData.jobNumber || !formData.jobNumber.trim()) {
      newErrors.jobNumber = 'Job number is required';
      isValid = false;
    }

    // Validate start time
    if (!formData.startTime || !formData.startTime.isValid()) {
      newErrors.startTime = 'Valid start time is required';
      isValid = false;
    }

    // Validate end time
    if (!formData.endTime || !formData.endTime.isValid()) {
      newErrors.endTime = 'Valid end time is required';
      isValid = false;
    }

    // Validate end time is after start time
    if (formData.startTime && formData.endTime && 
        formData.startTime.isValid() && formData.endTime.isValid() && 
        formData.endTime.isSameOrBefore(formData.startTime)) {
      newErrors.endTime = 'End time must be after start time';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
    // Clear error when date is changed
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = (force = false) => {
    if (!validateForm()) return;
    
    // Check if "All Technicians" is selected
    const isForAll = formData.Technicians?.some(tech => tech.id === 'all');
    
    // Prepare the data to be saved
    const eventData = {
      ...formData,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      forAll: isForAll,
      // If "All Technicians" is selected, save an empty array for individual technicians
      Technicians: isForAll ? [] : formData.Technicians
    };
    
    if (event?.isRecurring) {
      setRecurringAction('edit');
      setShowRecurringChoice(true);
    } else {
      onSave(eventData, 'single', force);
    }
  };

  const handleDelete = () => {
    if (event?.isRecurring) {
      setRecurringAction('delete');
      setShowRecurringChoice(true);
    } else if (window.confirm("Are you sure you wish to delete this event?")) {
      onDelete();
    }
  };
  
  const handleRecurringChoice = (choice) => {
    setShowRecurringChoice(false);
    if (!choice) return;

    // Check if "All Technicians" is selected
    const isForAll = formData.Technicians?.some(tech => tech.id === 'all');
    
    // Prepare the data to be saved for recurring events
    const eventData = {
      ...formData,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
      forAll: isForAll,
      // If "All Technicians" is selected, save an empty array for individual technicians
      Technicians: isForAll ? [] : formData.Technicians
    };

    if (recurringAction === 'edit') {
      onSave(eventData, choice);
    } else if (recurringAction === 'delete') {
      onDelete(choice);
    }
  };

  const handleSave = (rrule) => {
    if (newEvent) setFormData({ ...formData, recurrencePattern: rrule });
    else setFormData({ ...formData, recurrencePattern: rrule});
  };

  const handleTryAgain = () => {
    setShowConflicts(false);
    if (onClearConflicts) {
      onClearConflicts();
    }
    handleSubmit(false);
  };

  const handleForceOverride = () => {
    handleSubmit(true);
  };

  const formatDateTime = (dateTime) => {
    return moment(dateTime).format('MMM D, YYYY h:mm A');
  };

  const ConflictDisplay = ({ conflicts }) => (
    <Box sx={{ mb: 2 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>⚠️ Scheduling Conflicts Detected</AlertTitle>
        <Typography variant="body2" sx={{ mb: 2 }}>
          The following technicians are already scheduled during this time:
        </Typography>
        
        {conflicts.map((conflict, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#fff7ed' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#7c2d12', mb: 1 }}>
              {conflict.technicianName}
            </Typography>
            {conflict.conflictingEvents.map((conflictEvent, eventIndex) => (
              <Box key={eventIndex} sx={{ ml: 2, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {conflictEvent.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Job: {conflictEvent.jobNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(conflictEvent.startTime)} - {formatDateTime(conflictEvent.endTime)}
                </Typography>
              </Box>
            ))}
          </Paper>
        ))}
        
        <Paper sx={{ p: 2, bgcolor: '#fffbeb' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Options:
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Modify the event time or remove conflicting technicians</li>
              <li>Use "Force Save" to override conflicts</li>
              <li>Cancel to review and adjust manually</li>
            </ul>
          </Typography>
        </Paper>
      </Alert>
    </Box>
  );

  return (
    <>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent>
          {/* Show conflicts if they exist */}
          {conflictError && showConflicts && (
            <ConflictDisplay conflicts={conflictError.conflicts} />
          )}

          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
          />
          <Autocomplete 
            name="doctor"
            label="Doctor"
            options={doctors}
            getOptionLabel={option => option.customer}
            getOptionKey={option => option.id}
            value={formData.DoctorId ? doctors.filter(doc => doc.id === formData.DoctorId)[0] : null}
            onChange={(event, newValue) => {
              handleInputChange({
                target: { name: 'DoctorId', value: newValue ? newValue.id : null }
              });
            }}
            sx={{margin: "5px 0px 12px 0px"}}
            renderInput={(params) => <TextField {...params} label="Doctor" />}
          />
          <TechnicianSelector
            selectedTechnicians={formData.Technicians}
            availableTechnicians={technicians}
            onChange={(newTechnicians) => {
              setFormData({ ...formData, Technicians: newTechnicians });
            }}
          />
          
          <div className='event-dates-container'>           
            <div className='date-picker'>
              <DateTimePicker
                label="Start"
                value={formData.startTime}
                onChange={handleDateChange('startTime')}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.startTime,
                  }
                }}
              />
              {errors.startTime && (
                <FormHelperText error>{errors.startTime}</FormHelperText>
              )}
            </div>
            <div className='date-picker'>
              <DateTimePicker
                label="End"
                value={formData.endTime}
                onChange={handleDateChange('endTime')}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.endTime,
                  }
                }}
              />
              {errors.endTime && (
                <FormHelperText error>{errors.endTime}</FormHelperText>
              )}
            </div>
          </div>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.allDay}
                onChange={handleCheckboxChange}
                name="allDay"
              />
            }
            label="All Day"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isRecurring}
                onChange={handleCheckboxChange}
                name="isRecurring"
              />
            }
            label="Recurring"
          />
          {formData.isRecurring && 
            <RecurringEventForm 
              startDate={formData.startTime}
              rrule={formData.recurrencePattern ? formData.recurrencePattern : null}
              onChange={handleSave}
            />
          }
          <TextField
            select
            margin="dense"
            name="label"
            label="Label"
            fullWidth
            value={formData.label}
            onChange={handleInputChange}
          >
            {labels.map((label) => (
              <MenuItem key={label.value} value={label.value}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: label.color,
                  marginRight: '8px',
                  display: 'inline-block'
                }} />
                {label.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            margin="dense"
            name="jobNumber"
            label="Job"
            fullWidth
            value={formData.jobNumber}
            onChange={handleInputChange}
            error={!!errors.jobNumber}
          >
            {throughThirty.map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </TextField>
          {errors.jobNumber && (
            <FormHelperText error>{errors.jobNumber}</FormHelperText>
          )}
        </DialogContent>
        <DialogActions>
          {event && (
            <Button onClick={handleDelete} color="error" style={{ marginRight: 'auto' }}>
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          
          {/* Show conflict-specific buttons when there are conflicts */}
          {conflictError && showConflicts && (
            <>
              <Button 
                onClick={handleForceOverride} 
                color="warning"
                variant="outlined"
              >
                Force Save
              </Button>
              <Button 
                onClick={handleTryAgain} 
                color="primary"
                variant="contained"
              >
                Try Again
              </Button>
            </>
          )}
          
          {/* Show normal save button when no conflicts or conflicts are hidden */}
          {(!conflictError || !showConflicts) && (
            <Button 
              onClick={() => handleSubmit(false)} 
              color="primary"
              variant="contained"
            >
              {event ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
    <RecurringEventChoiceDialog
      open={showRecurringChoice}
      onClose={() => setShowRecurringChoice(false)}
      onChoice={handleRecurringChoice}
      mode={recurringAction}
    />
    </>
  );
}

export default EventDialog;