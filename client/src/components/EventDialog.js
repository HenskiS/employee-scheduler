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
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
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
  onClearGeneralError,
  onSaveCompletion
}) {
  const { technicians, doctors, labels, tags, maxJobNumber } = useScheduling();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    officeNotes: '',
    startTime: moment(),
    endTime: moment().add(4, 'hour'),
    allDay: false,
    label: 'none',
    jobNumbers: [],
    isRecurring: false,
    recurrencePattern: null,
    Technicians: [],
    DoctorId: null,
    confirmed: false,
    confirmedAt: null,
    tags: []
  });

  const [completionData, setCompletionData] = useState({
    jobNotes: '',
    clockInTime: null,
    clockOutTime: null,
    numberOfCases: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    startTime: '',
    endTime: '',
    jobNumbers: ''
  });
  const [jobNumberInput, setJobNumberInput] = useState('');
  const [showRecurringChoice, setShowRecurringChoice] = useState(false);
  const [recurringAction, setRecurringAction] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);

  // Parse job number range syntax (e.g., "1-6,8,10")
  const parseJobNumbers = (input) => {
    if (!input.trim()) return [];

    const numbers = new Set();
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range (e.g., "1-6")
        const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxJobNumber || start > end) {
          return null; // Invalid range
        }
        for (let i = start; i <= end; i++) {
          numbers.add(String(i));
        }
      } else {
        // Handle single number
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 1 || num > maxJobNumber) {
          return null; // Invalid number
        }
        numbers.add(String(num));
      }
    }

    return Array.from(numbers).sort((a, b) => parseInt(a) - parseInt(b));
  };

  // Convert job numbers array to display string
  const formatJobNumbers = (jobNumbers) => {
    if (!jobNumbers || jobNumbers.length === 0) return '';

    const sorted = jobNumbers.map(n => parseInt(n)).sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      if (i < sorted.length && sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        if (start === end) {
          ranges.push(String(start));
        } else if (end === start + 1) {
          ranges.push(String(start), String(end));
        } else {
          ranges.push(`${start}-${end}`);
        }
        if (i < sorted.length) {
          start = sorted[i];
          end = sorted[i];
        }
      }
    }

    return ranges.join(',');
  };

  useEffect(() => {
    if (event) {
      // Handle loading existing event
      const jobNums = event.jobNumbers || [];
      if (event.forAll) {
        // If the event is for all technicians, set a special "All Technicians" option
        setFormData({
          ...event,
          startTime: moment(event.startTime),
          endTime: moment(event.endTime),
          label: event.label ?? 'None',
          jobNumbers: jobNums,
          confirmedAt: event.confirmedAt ? moment(event.confirmedAt) : null,
          Technicians: [{ id: 'all', name: 'All Technicians', isAllOption: true }]
        });
      } else {
        // Regular event with specific technicians
        setFormData({
          ...event,
          startTime: moment(event.startTime),
          endTime: moment(event.endTime),
          label: event.label ?? 'None',
          jobNumbers: jobNums,
          confirmedAt: event.confirmedAt ? moment(event.confirmedAt) : null
        });
      }

      // Set the input field to formatted job numbers
      setJobNumberInput(formatJobNumbers(jobNums));

      // Clear errors when editing existing event
      setErrors({
        name: '',
        startTime: '',
        endTime: '',
        jobNumbers: ''
      });

      // Load completion data if it exists
      if (event.completion) {
        setCompletionData({
          jobNotes: event.completion.jobNotes || '',
          clockInTime: event.completion.clockInTime
            ? moment().startOf('day').add(moment.duration(event.completion.clockInTime))
            : null,
          clockOutTime: event.completion.clockOutTime
            ? moment().startOf('day').add(moment.duration(event.completion.clockOutTime))
            : null,
          numberOfCases: event.completion.numberOfCases || ''
        });
      } else {
        // Reset completion data if no completion exists
        setCompletionData({
          jobNotes: '',
          clockInTime: null,
          clockOutTime: null,
          numberOfCases: ''
        });
      }
    } else if (newEvent) {
      // For new events, if view is jobs, resourceId is jobNumbers
      // if view is techs, resourceId is TechnicianId
      let initialJobNumbers = [];
      let initialTechs = [];
      if (newEvent.view === "jobs") {
        initialJobNumbers = [newEvent.resourceId];
      } else {
        const techId = newEvent.resourceId;
        initialTechs = technicians.filter(t => t.id === techId);
      }
      setFormData({
        ...formData,
        startTime: moment(newEvent.start),
        endTime: moment(newEvent.end),
        jobNumbers: initialJobNumbers,
        allDay: newEvent.allDay,
        Technicians: initialTechs
      });

      // Set the input field to formatted job numbers
      setJobNumberInput(formatJobNumbers(initialJobNumbers));
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

    // Validate that at least one of: job numbers, technicians, or doctor is present
    const hasJobNumbers = formData.jobNumbers && formData.jobNumbers.length > 0;
    const hasTechnicians = formData.Technicians && formData.Technicians.length > 0;
    const hasDoctor = formData.DoctorId !== null && formData.DoctorId !== undefined;

    if (!hasJobNumbers && !hasTechnicians && !hasDoctor) {
      newErrors.jobNumbers = 'At least one of the following is required: job number(s), technician(s), or a doctor';
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

  const handleJobNumberInputChange = (e) => {
    const input = e.target.value;
    setJobNumberInput(input);

    // Parse and validate the input
    const parsed = parseJobNumbers(input);
    if (parsed === null && input.trim() !== '') {
      // Invalid input
      setErrors({ ...errors, jobNumbers: `Invalid format. Use ranges (1-6) or comma-separated numbers. Max is ${maxJobNumber}.` });
    } else {
      // Valid input or empty
      setFormData({ ...formData, jobNumbers: parsed || [] });
      // Clear error when valid input is provided
      if (parsed && parsed.length > 0) {
        setErrors({ ...errors, jobNumbers: '' });
      } else if (input.trim() === '') {
        // Don't show error for empty job numbers since they're now optional
        setErrors({ ...errors, jobNumbers: '' });
      }
    }
  };

  const handleSubmit = async (force = false) => {
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
      await onSave(eventData, 'single', force);

      // Save completion data if this is an existing event and onSaveCompletion is provided
      if (event?.id && onSaveCompletion) {
        const completionPayload = {
          jobNotes: completionData.jobNotes,
          clockInTime: completionData.clockInTime ? completionData.clockInTime.format('HH:mm:ss') : null,
          clockOutTime: completionData.clockOutTime ? completionData.clockOutTime.format('HH:mm:ss') : null,
          numberOfCases: completionData.numberOfCases ? parseInt(completionData.numberOfCases) : null
        };
        await onSaveCompletion(event.id, completionPayload);
      }
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
          <TextField
            margin="dense"
            name="officeNotes"
            label="Office Notes (Internal Only)"
            type="text"
            fullWidth
            multiline
            rows={2}
            value={formData.officeNotes}
            onChange={handleInputChange}
            helperText="These notes are for internal use only and will not appear on printed schedules"
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

          {/* Confirmation Section */}
          <Box sx={{ mt: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.confirmed}
                  onChange={(e) => {
                    const newConfirmed = e.target.checked;
                    setFormData({
                      ...formData,
                      confirmed: newConfirmed,
                      confirmedAt: newConfirmed ? moment() : null
                    });
                  }}
                  name="confirmed"
                />
              }
              label="Confirmed"
            />
            {formData.confirmed && (
              <DateTimePicker
                label="Confirmation Time"
                value={formData.confirmedAt}
                onChange={(time) => setFormData({ ...formData, confirmedAt: time })}
                slotProps={{
                  textField: {
                    size: 'small'
                  }
                }}
              />
            )}
          </Box>

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
            margin="dense"
            name="jobNumbers"
            label="Job Numbers"
            type="text"
            fullWidth
            value={jobNumberInput}
            onChange={handleJobNumberInputChange}
            error={!!errors.jobNumbers}
            helperText={errors.jobNumbers || 'Enter ranges (e.g., 1-6,8,10)'}
            placeholder="e.g., 1-6,8,10"
            sx={{ mt: 1, mb: 1 }}
          />

          {/* Completion Section - Only for existing events */}
          {event && (
            <>
              <Divider sx={{ my: 3 }}>
                <Chip label="Post-Event Completion" />
              </Divider>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These fields are for recording information after the job is completed.
              </Typography>

              <TextField
                margin="dense"
                name="jobNotes"
                label="Job Notes"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={completionData.jobNotes || ''}
                onChange={(e) => setCompletionData({ ...completionData, jobNotes: e.target.value })}
                helperText="Notes about how the job went, any issues, etc."
              />

              {/* Tags Section */}
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={(option) => option.name}
                value={formData.tags || []}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, tags: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    helperText="Add tags to categorize post-event notes"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.name}
                      {...getTagProps({ index })}
                      style={{ backgroundColor: option.color, color: '#fff' }}
                    />
                  ))
                }
                sx={{ mt: 2, mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <TimePicker
                    label="Clock In Time"
                    value={completionData.clockInTime}
                    onChange={(time) => setCompletionData({ ...completionData, clockInTime: time })}
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <TimePicker
                    label="Clock Out Time"
                    value={completionData.clockOutTime}
                    onChange={(time) => setCompletionData({ ...completionData, clockOutTime: time })}
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <TextField
                    name="numberOfCases"
                    label="Number of Cases"
                    type="number"
                    fullWidth
                    value={completionData.numberOfCases}
                    onChange={(e) => setCompletionData({ ...completionData, numberOfCases: e.target.value })}
                  />
                </Box>
              </Box>
            </>
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