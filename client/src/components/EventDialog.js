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

function EventDialog({ open, onClose, event, onSave }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    client_id: '',
    start_time: '',
    end_time: '',
    name: '',
    details: '',
  });
  const [employees, setEmployees] = useState([]);
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
    </Dialog>
    /*<Dialog open={open} onClose={onClose}>
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
            {employees.map((employee) => (
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
            type="datetime-local"
            value={formData.start_time}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            name="end_time"
            label="End Time"
            type="datetime-local"
            value={formData.end_time}
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
    </Dialog>*/
  );
}

export default EventDialog;