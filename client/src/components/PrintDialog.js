import React, { useState } from 'react';
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
  Box 
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { useScheduling } from './SchedulingContext';

const PrintDialog = ({ open, onClose, onPrint }) => {
  const { technicians, doctors, labels } = useScheduling();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [selectedView, setSelectedView] = useState('month');

  const handlePrint = () => {
    // Prepare the filter parameters
    const filterParams = {
      startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
      endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
      labels: selectedLabels,
      doctors: selectedDoctors,
      technicians: selectedTechnicians,
      view: selectedView
    };

    onPrint(filterParams);
    onClose();
  };

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DialogTitle>Print Events</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
            {/* View Selector */}
            <FormControl fullWidth>
              <InputLabel>View</InputLabel>
              <Select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                MenuProps={MenuProps}
              >
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="agenda">Agenda</MenuItem>
              </Select>
            </FormControl>

            {/* Date Range Selectors */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>

            {/* Labels Selector */}
            <FormControl fullWidth>
              <InputLabel>Event Labels</InputLabel>
              <Select
                multiple
                value={selectedLabels}
                onChange={(e) => setSelectedLabels(e.target.value)}
                renderValue={(selected) => selected.map(label => label.label).join(', ')}
                MenuProps={MenuProps}
              >
                {labels.map((labelObj) => (
                  <MenuItem key={labelObj.label} value={labelObj}>
                    <Checkbox checked={selectedLabels.some(l => l.label === labelObj.label)} />
                    <ListItemText primary={labelObj.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Doctors Selector */}
            <FormControl fullWidth>
              <InputLabel>Doctors</InputLabel>
              <Select
                multiple
                value={selectedDoctors}
                onChange={(e) => setSelectedDoctors(e.target.value)}
                renderValue={(selected) => selected.map(doc => doc.name).join(', ')}
                MenuProps={MenuProps}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.name} value={doctor}>
                    <Checkbox checked={selectedDoctors.some(doc => doc.name === doctor.name)} />
                    <ListItemText primary={doctor.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Technicians Selector */}
            <FormControl fullWidth>
              <InputLabel>Technicians</InputLabel>
              <Select
                multiple
                value={selectedTechnicians}
                onChange={(e) => setSelectedTechnicians(e.target.value)}
                renderValue={(selected) => selected.map(tech => tech.name).join(', ')}
                MenuProps={MenuProps}
              >
                {technicians.map((technician) => (
                  <MenuItem key={technician.name} value={technician}>
                    <Checkbox checked={selectedTechnicians.some(tech => tech.name === technician.name)} />
                    <ListItemText primary={technician.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handlePrint} variant="contained" color="primary">
            Print
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </Dialog>
  );
};

export default PrintDialog;