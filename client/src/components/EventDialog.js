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
import { useScheduling } from './SchedulingContext';

function EventDialog({ open, onClose, event, onSave, newEvent }) {
  const { technicians, labels } = useScheduling();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: moment(),
    end_time: moment().add(1, 'hour'),
    isAllDay: false,
    labelId: '',
    technicianId: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        start_time: moment(event.start),
        end_time: moment(event.end),
      });
    } else if (newEvent) {
      setFormData({
        ...formData,
        start_time: moment(newEvent.start),
        end_time: moment(newEvent.end),
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
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      start_time: formData.start_time.toISOString(),
      end_time: formData.end_time.toISOString(),
    });
    onClose();
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
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
          />
          <DateTimePicker
            label="Start"
            value={formData.start_time}
            onChange={handleDateChange('start_time')}
            renderInput={(props) => <TextField {...props} fullWidth margin="dense" />}
          />
          <DateTimePicker
            label="End"
            value={formData.end}
            onChange={handleDateChange('end_time')}
            renderInput={(props) => <TextField {...props} fullWidth margin="dense" />}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isAllDay}
                onChange={handleCheckboxChange}
                name="isAllDay"
              />
            }
            label="All Day"
          />
          <TextField
            select
            margin="dense"
            name="labelId"
            label="Label"
            fullWidth
            value={formData.labelId}
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
            name="technicianId"
            label="Technician"
            fullWidth
            value={formData.technicianId}
            onChange={handleInputChange}
          >
            {technicians.map((technician) => (
              <MenuItem key={technician.id} value={technician.id}>
                {technician.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
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