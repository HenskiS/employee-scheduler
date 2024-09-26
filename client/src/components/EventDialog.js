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
  Chip,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import axios from '../api/axios'
import { useScheduling } from './SchedulingContext';
import RecurringEventForm from './RecurringEventForm';

function EventDialog({ open, onClose, event, onSave, newEvent }) {
  const { technicians, doctors, labels, throughThirty, refreshData } = useScheduling();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: moment(),
    endTime: moment().add(4, 'hour'),
    allDay: false,
    label: 'None',
    jobNumber: '',
    isRecurring: false,
    rule: null,
    technicians: []
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
    if (name === "technicians") setFormData({...formData, technicians: technicians.push(value)})
    // console.log(`${name}: ${value}`)
    else setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked? true : false });
    console.log(formData)
  };
  
  const handleTechDelete = (e) => {
    //const { name, checked } = e.target;
    console.log("Tech delete...")
    //setFormData({ ...formData, [name]: checked? true : false });
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
    if (!event?.isRecurring || window.confirm("Deleting a recurring event will delete all future instances of this event. Are you sure?")) {
      try {
        await axios.delete(`/api/events/${event.id}`);
        refreshData();
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
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
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isRecurring? true:false}
                onChange={handleCheckboxChange}
                name="isRecurring"
              />
            }
            label="Recurring"
          />
          {formData.isRecurring && 
            <RecurringEventForm startDate={formData.startTime} rrule={formData.RecurrenceRule?.rule ?? null} onSave={(rrule)=>setFormData({ ...formData, rule: rrule}) } />}
          <p>{formData.rule}</p>
          <p>{formData.until}</p>
          {/*<div className='dialog-split'>
            <div className='left'>*/}
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
            {/*</div>
            <Divider orientation='vertical' flexItem style={{margin: "0px 10px"}}/>
            <div className="right">*/}
              {/*<TextField
                select
                margin="dense"
                name="doctor"
                label="Doctor"
                fullWidth
                value={formData.doctor}
                onChange={handleInputChange}
              >
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor}>
                    {doctor.name}
                  </MenuItem>
                ))}
              </TextField>
              {newEvent? null:<Button variant='outlined'>Technicians</Button>}*/}
            {/*</div>
          </div>*/}
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