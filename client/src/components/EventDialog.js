import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';
import moment from 'moment';
import { useScheduling } from './SchedulingContext';

function EventDialog({ open, onClose, event, onSave, newEvent }) {
  const [formData, setFormData] = useState({
    event_id: '',
    client_id: '',
    start_time: newEvent?.start ?? '',
    end_time: newEvent?.end ?? '',
    event_name: '',
    description: '',
    is_all_day: false,
    technician_name: newEvent?.technician?.name ?? '',
    label: '', // TEXT CHECK(label IN ('Available', 'Unavailable', 'TOR')),
    created_by: null,
    created_at: null, // TEXT DEFAULT (datetime('now')),
    updated_by: null, // INTEGER,
    updated_at: null // TEXT DEFAULT (datetime('now')),
  });
  const [employees, setEmployees] = useState([]);
  const { technicians } = useScheduling();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (event) {
      setFormData(event);
    }
    //loadEmployeesAndClients();
  }, [event]);

  /*const loadEmployeesAndClients = async () => {
    try {
      const [fetchedEmployees, fetchedClients] = await Promise.all([
        fetchEmployees(),
        fetchClients(),
      ]);
      setEmployees(fetchedEmployees);
      setClients(fetchedClients);
    } catch (error) {
      console.error('Error loading employees and clients:', error);
    }
  };*/

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            name="employee_id"
            label="Employee"
            value={formData.employee_id}
            onChange={handleInputChange}
          >
            {technicians.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            name="client_id"
            label="Client"
            value={formData.client_id}
            onChange={handleInputChange}
          >
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            name="start_time"
            label="Start Time"
            type="time"
            value={moment(formData.start_time).format('HH:mm')}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            name="end_time"
            label="End Time"
            type="time"
            value={moment(formData.end_time).format('HH:mm')}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            name="name"
            label="Event Name"
            value={formData.name}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            name="details"
            label="Details"
            multiline
            rows={4}
            value={formData.details}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EventDialog;