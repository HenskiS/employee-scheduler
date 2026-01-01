import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Typography,
  TextField,
  Autocomplete,
  Chip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useScheduling } from './SchedulingContext';

const defaultDisplayOptions = {
  showDescription: true,
  showLabel: true,
  showTechnicians: true,
  showOfficeNotes: false,
  doctorInfo: {
    showName: true,
    showAddress: false,
    showPhone: false,
  }
};

const PrintDialog = ({ open, onClose, onPrint, shouldReset, initialValues }) => {
  const { technicians, doctors, labels, tags } = useScheduling();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedView, setSelectedView] = useState('agenda');
  const [dateError, setDateError] = useState(false);
  const [displayOptions, setDisplayOptions] = useState(defaultDisplayOptions);
  const [customHeader, setCustomHeader] = useState('');

  // Reset state only when shouldReset is true
  useEffect(() => {
    if (shouldReset && open) {
      setStartDate(null);
      setEndDate(null);
      setSelectedLabels([]);
      setSelectedDoctors([]);
      setSelectedTechnicians([]);
      setSelectedTags([]);
      setSelectedView('agenda');
      setDateError(false);
      setDisplayOptions(defaultDisplayOptions);
      setCustomHeader('');
    }
  }, [shouldReset, open]);

  // Set initial values when provided
  useEffect(() => {
    if (initialValues && open && !shouldReset) {
      // Set dates
      if (initialValues.startDate) {
        setStartDate(moment(initialValues.startDate));
      }
      if (initialValues.endDate) {
        setEndDate(moment(initialValues.endDate));
      }

      // Set view
      if (initialValues.view) {
        setSelectedView(initialValues.view);
      }

      // Set display options
      if (initialValues.displayOptions) {
        setDisplayOptions(initialValues.displayOptions);
      }

      // Set custom header
      if (initialValues.customHeader) {
        setCustomHeader(initialValues.customHeader);
      }

      // Match and set labels
      if (initialValues.labels && labels.length > 0) {
        const matchedLabels = labels.filter(label =>
          initialValues.labels.some(initLabel => initLabel.label === label.label)
        );
        setSelectedLabels(matchedLabels);
      }

      // Match and set doctors by ID (more efficient and reliable)
      if (initialValues.doctors && doctors.length > 0) {
        const matchedDoctors = doctors.filter(doctor =>
          initialValues.doctors.some(initDoctor => initDoctor.id === doctor.id)
        );
        setSelectedDoctors(matchedDoctors);
      }

      // Match and set technicians by ID (more efficient and reliable)
      if (initialValues.technicians && technicians.length > 0) {
        const matchedTechnicians = technicians.filter(technician =>
          initialValues.technicians.some(initTech => initTech.id === technician.id)
        );
        setSelectedTechnicians(matchedTechnicians);
      }

      // Match and set tags by ID
      if (initialValues.tags && tags.length > 0) {
        const matchedTags = tags.filter(tag =>
          initialValues.tags.some(initTag => initTag.id === tag.id)
        );
        setSelectedTags(matchedTags);
      }
    }
  }, [initialValues, open, shouldReset, labels, doctors, technicians, tags]);

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

    // Create URL parameters with optimized data
    const params = new URLSearchParams();
    params.set('startDate', startDate.format('YYYY-MM-DD'));
    params.set('endDate', endDate.format('YYYY-MM-DD'));
    params.set('view', selectedView);

    // Store only IDs and essential data for arrays
    if (selectedLabels.length > 0) {
      const compactLabels = selectedLabels.map(label => ({
        label: label.label,
        color: label.color
      }));
      params.set('labels', encodeURIComponent(JSON.stringify(compactLabels)));
    }

    if (selectedDoctors.length > 0) {
      const doctorIds = selectedDoctors.map(doctor => doctor.id);
      params.set('doctors', doctorIds.join(','));
    }

    if (selectedTechnicians.length > 0) {
      const technicianIds = selectedTechnicians.map(tech => tech.id);
      params.set('technicians', technicianIds.join(','));
    }

    if (selectedTags.length > 0) {
      const tagIds = selectedTags.map(tag => tag.id);
      params.set('tags', tagIds.join(','));
    }

    // Add custom header if provided
    if (customHeader) {
      params.set('header', encodeURIComponent(customHeader));
    }

    // Compress display options by only storing non-default values
    const defaultOpts = defaultDisplayOptions;
    const compactDisplayOptions = {};

    if (displayOptions.showDescription !== defaultOpts.showDescription) {
      compactDisplayOptions.d = displayOptions.showDescription;
    }
    if (displayOptions.showLabel !== defaultOpts.showLabel) {
      compactDisplayOptions.l = displayOptions.showLabel;
    }
    if (displayOptions.showTechnicians !== defaultOpts.showTechnicians) {
      compactDisplayOptions.t = displayOptions.showTechnicians;
    }
    if (displayOptions.showOfficeNotes !== defaultOpts.showOfficeNotes) {
      compactDisplayOptions.on = displayOptions.showOfficeNotes;
    }
    if (displayOptions.doctorInfo.showName !== defaultOpts.doctorInfo.showName) {
      compactDisplayOptions.dn = displayOptions.doctorInfo.showName;
    }
    if (displayOptions.doctorInfo.showAddress !== defaultOpts.doctorInfo.showAddress) {
      compactDisplayOptions.da = displayOptions.doctorInfo.showAddress;
    }
    if (displayOptions.doctorInfo.showPhone !== defaultOpts.doctorInfo.showPhone) {
      compactDisplayOptions.dp = displayOptions.doctorInfo.showPhone;
    }

    if (Object.keys(compactDisplayOptions).length > 0) {
      params.set('opts', encodeURIComponent(JSON.stringify(compactDisplayOptions)));
    }

    // Close dialog and navigate
    onClose();
    navigate(`/print-preview?${params.toString()}`);
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
                <MenuItem value="agenda">Agenda</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="week">Week</MenuItem>
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

            {/* Custom Header */}
            <TextField
              fullWidth
              label="Custom Header (Optional)"
              value={customHeader}
              onChange={(e) => setCustomHeader(e.target.value)}
              placeholder="e.g. MASTER_07.01"
              helperText="Appears below 'Mobile Mohs, Inc.' on every page"
              variant="outlined"
              size="small"
            />

            {/* Display Options */}
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '1rem', mb: 0.5 }}>Display Options</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showOfficeNotes}
                        onChange={() => handleDisplayOptionChange('showOfficeNotes')}
                      />
                    }
                    label={<Typography sx={{ fontSize: '1rem' }}>Office Notes</Typography>}
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
                renderValue={(selected) => selected.map(doc => doc.customer).join(', ')}
                label="Doctors"
                MenuProps={MenuProps}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={`${doctor.customer} - ${doctor.city}`} value={doctor}>
                    <Checkbox checked={selectedDoctors.some(doc => `${doc.customer} - ${doc.city}` === `${doctor.customer} - ${doctor.city}`)} />
                    <ListItemText primary={`${doctor.customer} - ${doctor.city}`} />
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

            {/* Tags Selector */}
            <Autocomplete
              multiple
              options={tags.filter(tag => tag.appliesTo.includes('event'))}
              value={selectedTags}
              onChange={(event, newValue) => setSelectedTags(newValue)}
              getOptionLabel={(option) => option.name}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option.name}
                      {...tagProps}
                      style={{
                        backgroundColor: option.color,
                        color: '#fff',
                        fontWeight: 500
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Event Tags"
                  placeholder="Filter by tags"
                />
              )}
            />
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