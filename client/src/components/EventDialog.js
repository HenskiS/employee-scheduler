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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import axios from '../api/axios'
import { useScheduling } from './SchedulingContext';

function EventDialog({ open, onClose, event, onSave, newEvent }) {
  const { technicians, labels, throughThirty, refreshData } = useScheduling();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: moment(),
    endTime: moment().add(4, 'hour'),
    allDay: false,
    label: 'None',
    jobNumber: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        startTime: moment(event.startTime),
        endTime: moment(event.endTime),
        label: event.label ?? 'None'
      });
    } else if (newEvent) {
      setFormData({
        ...formData,
        startTime: moment(newEvent.start),
        endTime: moment(newEvent.end),
        jobNumber: newEvent.resourceId,
        allDay: newEvent.allDay
      });
    }
  }, [event, newEvent]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked? true : false });
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      startTime: formData.startTime.toISOString(),
      endTime: formData.endTime.toISOString(),
    });
    onClose();
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/events/${event.id}`);
      refreshData();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0px' }}>
          <DateTimePicker
            label="Start"
            value={formData.startTime}
            onChange={handleDateChange('startTime')}
          />
          <DateTimePicker
            label="End"
            value={formData.endTime}
            onChange={handleDateChange('endTime')}
          />
          </div>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.allDay? true:false}
                onChange={handleCheckboxChange}
                name="allDay"
              />
            }
            label="All Day"
          />
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
              <MenuItem key={label} value={label}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            margin="dense"
            name="job"
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
//The error "checkbox changing from uncontrolled to controlled" 
//typically occurs when the initial value of the checkbox is undefined, 
//and then it's later set to a boolean value. In this case, the issue is 
//likely caused by the formData.allDay property being undefined when the
// component first renders. To fix this, you should ensure that formData.allDay
// is always initialized with a boolean value, either true or false, in the initial
// state and when setting the form data based on the event or newEvent props.