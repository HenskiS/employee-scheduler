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
  Chip,
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
  onClearConflicts,
  generalError,
  onClearGeneralError
}) {
  const { technicians, doctors, labels, throughThirty } = useScheduling();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: moment(),
    endTime: moment().add(4, 'hour'),
    allDay: false,
    label: 'none',
    jobNumbers: [],
    isRecurring: false,
    recurrencePattern: null,
    Technicians: [],
    DoctorId: null
  });

  const [errors, setErrors] = useState({
    name: '',
    startTime: '',
    endTime: '',
    jobNumbers: ''
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
          jobNumbers: event.jobNumbers || [],
          Technicians: [{ id: 'all', name: 'All Technicians', isAllOption: true }]
        });
      } else {
        // Regular event with specific technicians
        setFormData({
          ...event,
          startTime: moment(event.startTime),
          endTime: moment(event.endTime),
          label: event.label ?? 'None',
          jobNumbers: event.jobNumbers || []
        });
      }
      
      // Clear errors when editing existing event
      setErrors({
        name: '',
        startTime: '',
        endTime: '',
        jobNumbers: ''
      });
    } else if (newEvent) {
      // For new events, if view is jobs, resourceId is jobNumbers
      // if view is techs, resourceId is TechnicianId
      let initialJobNumbers = [];
      let initialTechs = [];
      if (newEvent.view === "jobs") {
        initialJobNumbers = [newEvent.resourceId]
      } else {
        const techId = newEvent.resourceId
        initialTechs = technicians.filter(t => t.id === techId)
      }
      setFormData({
        ...formData,
        startTime: moment(newEvent.start),
        endTime: moment(newEvent.end),
        jobNumbers: initialJobNumbers,
        allDay: newEvent.allDay,
        Technicians: initialTechs
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
      jobNumbers: ''
    };
    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Validate job numbers
    if (!formData.jobNumbers || formData.jobNumbers.length === 0) {
      newErrors.jobNumbers = 'At least one job number is required';
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

  const handleJobNumbersChange = (event, newValue) => {
    setFormData({ ...formData, jobNumbers: newValue });
    // Clear error when job numbers are changed
    if (errors.jobNumbers) {
      setErrors({ ...errors, jobNumbers: '' });
    }
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
    setFormData({ ...formData, recurrencePattern: rrule });
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

  const TechnicianConflictDisplay = ({ conflicts }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ color: '#7c2d12', mb: 1, fontWeight: 'bold' }}>
        👥 Technician Conflicts
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        The following technicians are already scheduled during this time:
      </Typography>
      
      {conflicts.map((conflict, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#7c2d12', mb: 1 }}>
            {conflict.technicianName}
          </Typography>
          {conflict.conflictingEvents.map((conflictEvent, eventIndex) => (
            <Box key={eventIndex} sx={{ ml: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {conflictEvent.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jobs: {Array.isArray(conflictEvent.jobNumbers) 
                  ? conflictEvent.jobNumbers.join(', ') 
                  : (conflictEvent.jobNumber || 'N/A')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(conflictEvent.startTime)} - {formatDateTime(conflictEvent.endTime)}
              </Typography>
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );

  const DoctorConflictDisplay = ({ conflicts }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ color: '#7c2d12', mb: 1, fontWeight: 'bold' }}>
        🩺 Doctor Conflicts
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        The following doctor is already scheduled during this time:
      </Typography>
      
      {conflicts.map((conflict, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#fef3f2', border: '1px solid #fecaca' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#7c2d12', mb: 1 }}>
            {conflict.doctorName}
          </Typography>
          {conflict.conflictingEvents.map((conflictEvent, eventIndex) => (
            <Box key={eventIndex} sx={{ ml: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {conflictEvent.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jobs: {Array.isArray(conflictEvent.jobNumbers) 
                  ? conflictEvent.jobNumbers.join(', ') 
                  : (conflictEvent.jobNumber || 'N/A')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(conflictEvent.startTime)} - {formatDateTime(conflictEvent.endTime)}
              </Typography>
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );

  const ConflictDisplay = ({ conflictError }) => {
    const hasTechnicianConflicts = conflictError.technicianConflicts && conflictError.technicianConflicts.length > 0;
    const hasDoctorConflicts = conflictError.doctorConflicts && conflictError.doctorConflicts.length > 0;
    
    return (
      <Box sx={{ mb: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>⚠️ Scheduling Conflicts Detected</AlertTitle>
          
          {hasTechnicianConflicts && (
            <TechnicianConflictDisplay conflicts={conflictError.technicianConflicts} />
          )}
          
          {hasDoctorConflicts && (
            <DoctorConflictDisplay conflicts={conflictError.doctorConflicts} />
          )}
          
          {hasTechnicianConflicts && hasDoctorConflicts && (
            <Divider sx={{ my: 2 }} />
          )}
          
          <Paper sx={{ p: 2, bgcolor: '#fffbeb' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Options:
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Modify the event time or remove conflicting staff</li>
                <li>Use "Force Save" to override conflicts</li>
                <li>Cancel to review and adjust manually</li>
              </ul>
            </Typography>
          </Paper>
        </Alert>
      </Box>
    );
  };

  return (
    <>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent>
          {/* Show general errors */}
          {generalError && (
            <Alert severity="error" onClose={onClearGeneralError} sx={{ mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {generalError}
            </Alert>
          )}

          {/* Show conflicts if they exist */}
          {conflictError && showConflicts && (
            <ConflictDisplay conflictError={conflictError} />
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
            getOptionLabel={option => `${option.customer} - ${option.city}`}
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
          
          {/* Replace single job number dropdown with multi-select */}
          <Autocomplete
            multiple
            options={throughThirty}
            value={formData.jobNumbers || []}
            onChange={handleJobNumbersChange}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip 
                    key={key}
                    variant="outlined" 
                    label={option} 
                    {...tagProps} 
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Job Numbers"
                placeholder="Select job numbers"
                error={!!errors.jobNumbers}
                helperText={errors.jobNumbers}
                required
              />
            )}
            sx={{ mt: 1, mb: 1 }}
          />
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