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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import axios from '../api/axios';
import { useScheduling } from './SchedulingContext';
import RecurringEventForm from './RecurringEventForm';
import TechnicianSelector from './TechnicianSelector';

function EventDialog({ open, onClose, event, onSave, newEvent }) {
  const { technicians, doctors, labels, throughThirty, refreshData } = useScheduling();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: moment(),
    endTime: moment().add(4, 'hour'),
    allDay: false,
    label: 'none',
    jobNumber: '',
    isRecurring: false,
    RecurrenceRule: null,
    rule: '',
    Technicians: [],
    DoctorId: null
  });

  const [errors, setErrors] = useState({
    name: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        startTime: moment(event.startTime),
        endTime: moment(event.endTime),
        label: event.label ?? 'None'
      });
      // Clear errors when editing existing event
      setErrors({
        name: '',
        startTime: '',
        endTime: ''
      });
    } else if (newEvent) {
      setFormData({
        ...formData,
        startTime: moment(newEvent.start),
        endTime: moment(newEvent.end),
        jobNumber: newEvent.resourceId,
        allDay: newEvent.allDay,
        rule: ''
      });
    }
  }, [event, newEvent]);

  const validateForm = () => {
    const newErrors = {
      name: '',
      startTime: '',
      endTime: ''
    };
    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

  const handleSubmit = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
      });
      onClose();
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you wish to delete this event?")) {
      if (!event?.isRecurring || window.confirm("Deleting a recurring event will delete all future instances of this event. Are you sure?")) {
        try {
          await axios.delete(`/events/${event.id}`);
          refreshData();
          onClose();
        } catch (error) {
          console.error('Error deleting event:', error);
        }
      }
    }
  };

  const handleSave = (rrule) => {
    if (newEvent) setFormData({ ...formData, rule: rrule });
    else setFormData({ ...formData, RecurrenceRule: {...formData.RecurrenceRule, rule: rrule}});
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent>
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
            getOptionLabel={option => option.name}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0px' }}>
            <div>
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
            <div>
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
              rrule={formData.RecurrenceRule?.rule ? formData.RecurrenceRule.rule : null}
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
          >
            {throughThirty.map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          {event && (
            <Button onClick={handleDelete} color="error" style={{ marginRight: 'auto' }}>
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {event ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default EventDialog;