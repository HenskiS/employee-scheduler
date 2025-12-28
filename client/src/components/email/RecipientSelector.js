import { useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  TextField,
  Chip,
  Stack,
  Autocomplete,
  Paper,
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const RecipientSelector = ({
  doctors,
  technicians,
  users,
  selectedRecipients,
  setSelectedRecipients,
  validationErrors
}) => {
  // State for custom email input
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [emailInputError, setEmailInputError] = useState('');

  // State for expanded doctor cards
  const [expandedDoctors, setExpandedDoctors] = useState({});

  // Doctor selection - add doctor to selected list
  const handleDoctorSelect = (_event, doctor) => {
    if (!doctor) return;

    // Check if doctor already selected
    if (selectedRecipients.doctors.some(d => d.id === doctor.id)) {
      return;
    }

    // Add doctor with no emails selected initially
    setSelectedRecipients({
      ...selectedRecipients,
      doctors: [...selectedRecipients.doctors, { ...doctor, selectedEmails: [] }]
    });

    // Expand the newly added doctor
    setExpandedDoctors({ ...expandedDoctors, [doctor.id]: true });
  };

  // Remove entire doctor
  const handleRemoveDoctor = (doctorId) => {
    setSelectedRecipients({
      ...selectedRecipients,
      doctors: selectedRecipients.doctors.filter(d => d.id !== doctorId)
    });

    // Remove from expanded state
    const newExpanded = { ...expandedDoctors };
    delete newExpanded[doctorId];
    setExpandedDoctors(newExpanded);
  };

  // Toggle doctor expansion
  const toggleDoctorExpansion = (doctorId) => {
    setExpandedDoctors({
      ...expandedDoctors,
      [doctorId]: !expandedDoctors[doctorId]
    });
  };

  // Per-doctor quick-select handlers
  const handleDoctorSelectAllScheduling = (doctor) => {
    const schedulingEmails = doctor.emails.filter(e => e.type === 'scheduling');
    setSelectedRecipients({
      ...selectedRecipients,
      doctors: selectedRecipients.doctors.map(d =>
        d.id === doctor.id ? { ...d, selectedEmails: schedulingEmails } : d
      )
    });
  };

  const handleDoctorSelectPrimaryOnly = (doctor) => {
    const primaryEmails = doctor.emails.filter(e => e.isPrimary);
    setSelectedRecipients({
      ...selectedRecipients,
      doctors: selectedRecipients.doctors.map(d =>
        d.id === doctor.id ? { ...d, selectedEmails: primaryEmails } : d
      )
    });
  };

  const handleDoctorClearEmails = (doctor) => {
    setSelectedRecipients({
      ...selectedRecipients,
      doctors: selectedRecipients.doctors.map(d =>
        d.id === doctor.id ? { ...d, selectedEmails: [] } : d
      )
    });
  };

  // Toggle individual email for a doctor
  const handleDoctorEmailToggle = (doctor, email) => {
    const selectedDoctor = selectedRecipients.doctors.find(d => d.id === doctor.id);
    const isSelected = selectedDoctor?.selectedEmails.some(e => e.id === email.id);

    if (isSelected) {
      // Remove email
      setSelectedRecipients({
        ...selectedRecipients,
        doctors: selectedRecipients.doctors.map(d =>
          d.id === doctor.id
            ? { ...d, selectedEmails: d.selectedEmails.filter(e => e.id !== email.id) }
            : d
        )
      });
    } else {
      // Add email
      setSelectedRecipients({
        ...selectedRecipients,
        doctors: selectedRecipients.doctors.map(d =>
          d.id === doctor.id
            ? { ...d, selectedEmails: [...d.selectedEmails, email] }
            : d
        )
      });
    }
  };

  // Custom email handlers
  const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddCustomEmail = () => {
    const email = customEmailInput.trim();
    if (!email) return;

    if (!validateEmailFormat(email)) {
      setEmailInputError('Invalid email format');
      return;
    }

    if (selectedRecipients.customEmails.includes(email)) {
      setEmailInputError('Email already added');
      return;
    }

    setSelectedRecipients({
      ...selectedRecipients,
      customEmails: [...selectedRecipients.customEmails, email]
    });
    setCustomEmailInput('');
    setEmailInputError('');
  };

  const handleRemoveCustomEmail = (email) => {
    setSelectedRecipients({
      ...selectedRecipients,
      customEmails: selectedRecipients.customEmails.filter(e => e !== email)
    });
  };

  // Count total recipients
  const totalRecipients =
    selectedRecipients.doctors.reduce((sum, d) => sum + d.selectedEmails.length, 0) +
    selectedRecipients.technicians.length +
    selectedRecipients.users.length +
    selectedRecipients.customEmails.length;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Recipients ({totalRecipients} selected)
      </Typography>

      {validationErrors && validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Doctors Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Doctors ({selectedRecipients.doctors.reduce((sum, d) => sum + d.selectedEmails.length, 0)} emails selected)
        </Typography>

        <Autocomplete
          options={doctors.filter(d => !selectedRecipients.doctors.some(selected => selected.id === d.id))}
          getOptionLabel={(option) => {
            const name = option.customer || 'Unnamed Doctor';
            return option.city ? `${name} - ${option.city}` : name;
          }}
          onChange={handleDoctorSelect}
          value={null}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search and select doctors..."
              variant="outlined"
              size="small"
            />
          )}
        />

        {/* Selected Doctors */}
        {selectedRecipients.doctors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {selectedRecipients.doctors.map(doctor => {
              const hasEmails = doctor.emails && doctor.emails.length > 0;
              const isExpanded = expandedDoctors[doctor.id];

              return (
                <Paper key={doctor.id} sx={{ mb: 1, p: 2 }} variant="outlined">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleDoctorExpansion(doctor.id)}
                        disabled={!hasEmails}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Typography variant="body2" fontWeight="bold">
                        {doctor.customer}{doctor.city && ` - ${doctor.city}`}
                      </Typography><div className=""></div>
                      <Typography variant="caption" color="text.secondary">
                        ({doctor.selectedEmails.length} of {hasEmails ? doctor.emails.length : 0} emails)
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveDoctor(doctor.id)}
                      color="error"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Collapse in={isExpanded}>
                    {!hasEmails ? (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        No emails available
                      </Typography>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        {/* Quick-select buttons for this doctor */}
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDoctorSelectAllScheduling(doctor)}
                          >
                            All Scheduling
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDoctorSelectPrimaryOnly(doctor)}
                          >
                            Primary Only
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDoctorClearEmails(doctor)}
                          >
                            Clear
                          </Button>
                        </Stack>

                        {/* Individual email checkboxes */}
                        <Box sx={{ ml: 2 }}>
                          {doctor.emails.map(email => {
                            const isSelected = doctor.selectedEmails.some(e => e.id === email.id);
                            return (
                              <FormControlLabel
                                key={email.id}
                                control={
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleDoctorEmailToggle(doctor, email)}
                                    size="small"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body2">{email.email}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {email.type}
                                      {email.isPrimary && ' • Primary'}
                                      {email.label && ` • ${email.label}`}
                                    </Typography>
                                  </Box>
                                }
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </Collapse>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Technicians Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Technicians ({selectedRecipients.technicians.length} selected)
        </Typography>

        <Autocomplete
          multiple
          options={technicians}
          getOptionLabel={(option) => option.name || 'Unnamed Technician'}
          value={selectedRecipients.technicians}
          onChange={(_event, newValue) => {
            setSelectedRecipients({ ...selectedRecipients, technicians: newValue });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search and select technicians..."
              variant="outlined"
              size="small"
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box>
                <Typography variant="body2">{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.email || 'No email'}
                </Typography>
              </Box>
            </li>
          )}
        />
      </Box>

      {/* Users Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Users ({selectedRecipients.users.length} selected)
        </Typography>

        <Autocomplete
          multiple
          options={users}
          getOptionLabel={(option) => option.name || 'Unnamed User'}
          value={selectedRecipients.users}
          onChange={(_event, newValue) => {
            setSelectedRecipients({ ...selectedRecipients, users: newValue });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search and select users..."
              variant="outlined"
              size="small"
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box>
                <Typography variant="body2">{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.email || 'No email'}
                </Typography>
              </Box>
            </li>
          )}
        />
      </Box>

      {/* Custom Emails Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Custom Email Addresses ({selectedRecipients.customEmails.length} added)
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Email Address"
            value={customEmailInput}
            onChange={(e) => {
              setCustomEmailInput(e.target.value);
              setEmailInputError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomEmail();
              }
            }}
            error={!!emailInputError}
            helperText={emailInputError}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCustomEmail}
          >
            Add
          </Button>
        </Box>

        {selectedRecipients.customEmails.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedRecipients.customEmails.map((email, index) => (
              <Chip
                key={index}
                label={email}
                onDelete={() => handleRemoveCustomEmail(email)}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default RecipientSelector;
