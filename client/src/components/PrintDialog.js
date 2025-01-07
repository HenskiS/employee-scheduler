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
  Box, 
  Alert,
  FormGroup,
  FormControlLabel,
  Typography
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
  const [dateError, setDateError] = useState(false);
  
  // New state for display options
  const [displayOptions, setDisplayOptions] = useState({
    showDescription: true,
    showLabel: true,
    showTechnicians: true,
    doctorInfo: {
      showName: true,
      showAddress: false,
      showPhone: false,
    }
  });

  const handleDisplayOptionChange = (option) => {
    if (option.startsWith('doctor.')) {
      const field = option.split('.')[1];
      setDisplayOptions(prev => ({
        ...prev,
        doctorInfo: {
          ...prev.doctorInfo,
          [field]: !prev.doctorInfo[field]
        }
      }));
    } else {
      setDisplayOptions(prev => ({
        ...prev,
        [option]: !prev[option]
      }));
    }
  };

  const handlePreview = () => {
    // Check if both dates are selected
    if (!startDate || !endDate) {
      setDateError('Please select both start and end dates');
      return;
    }

    // Check if dates are valid
    if (!startDate.isValid() || !endDate.isValid()) {
      setDateError('Invalid date format');
      return;
    }

    // Check date order
    if (startDate.isAfter(endDate)) {
      setDateError('Start date must be before end date');
      return;
    }
    
    setDateError(false);
    const filterParams = {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      labels: selectedLabels,
      doctors: selectedDoctors,
      technicians: selectedTechnicians,
      view: selectedView,
      displayOptions
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
            {/* View Selector with fixed styling */}
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ textDecoration: 'none' }}>View</InputLabel>
              <Select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                label="View"
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
                onChange={(date) => {
                  setStartDate(date);
                  setDateError(false);
                }}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                  } 
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  setDateError(false);
                }}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                  } 
                }}
              />
            </Box>

            {dateError && (
              <Alert severity="error" onClose={() => setDateError(false)}>
                {dateError}
              </Alert>
            )}

            {/* Display Options */}
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '1rem', mb: 0.5 }}>Display Options</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showDescription}
                        onChange={() => handleDisplayOptionChange('showDescription')}
                      />
                    }
                    label={<Typography sx={{ fontSize: '1rem' }}>Description</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showLabel}
                        onChange={() => handleDisplayOptionChange('showLabel')}
                      />
                    }
                    label={<Typography sx={{ fontSize: '1rem' }}>Label</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showTechnicians}
                        onChange={() => handleDisplayOptionChange('showTechnicians')}
                      />
                    }
                    label={<Typography sx={{ fontSize: '1rem' }}>Technicians</Typography>}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '1rem' }}>Doctor Info:</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.doctorInfo.showName}
                        onChange={() => handleDisplayOptionChange('doctor.showName')}
                      />
                    }
                    label={<Typography sx={{ fontSize: '1rem' }}>Name</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.doctorInfo.showAddress}
                        onChange={() => handleDisplayOptionChange('doctor.showAddress')}
                      />
                    }
                    label={<Typography sx={{ fontSize: '1rem' }}>Address</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.doctorInfo.showPhone}
                        onChange={() => handleDisplayOptionChange('doctor.showPhone')}
                      />
                    }
                    label={<Typography sx={{ fontSize: '1rem' }}>Phone</Typography>}
                  />
                </Box>
              </Box>
            </Box>

            {/* Labels Selector */}
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ textDecoration: 'none' }}>Event Labels</InputLabel>
              <Select
                multiple
                value={selectedLabels}
                onChange={(e) => setSelectedLabels(e.target.value)}
                renderValue={(selected) => selected.map(label => label.label).join(', ')}
                label="Event Labels"
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
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ textDecoration: 'none' }}>Doctors</InputLabel>
              <Select
                multiple
                value={selectedDoctors}
                onChange={(e) => setSelectedDoctors(e.target.value)}
                renderValue={(selected) => selected.map(doc => doc.name).join(', ')}
                label="Doctors"
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
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ textDecoration: 'none' }}>Technicians</InputLabel>
              <Select
                multiple
                value={selectedTechnicians}
                onChange={(e) => setSelectedTechnicians(e.target.value)}
                renderValue={(selected) => selected.map(tech => tech.name).join(', ')}
                label="Technicians"
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
          <Button onClick={handlePreview} variant="contained" color="primary">
            Preview
          </Button>
        </DialogActions>
      </LocalizationProvider>
    </Dialog>
  );
};

export default PrintDialog;