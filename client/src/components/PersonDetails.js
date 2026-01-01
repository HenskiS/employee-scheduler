import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Stack,
  Autocomplete,
  Chip
} from '@mui/material';
import { Save, Edit, Delete, Add, Remove } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';
import axios from '../api/axios';
import { useScheduling } from './SchedulingContext';

const FIELD_CONFIGS = {
  0: [ // Doctors
    { key: 'customer', label: 'Customer', required: true },
    { key: 'practiceName', label: 'Practice Name', required: true },
    { key: 'physicalAddress', label: 'Physical Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'Zip' },
    { key: 'schedulingContact1', label: 'Scheduling Contact #1' },
    { key: 'schedulingPhone1', label: 'Scheduling Phone #1' },
    { key: 'schedulingContact2', label: 'Scheduling Contact #2' },
    { key: 'schedulingPhone2', label: 'Scheduling Phone #2' },
    { key: 'billTo', label: 'Bill to' },
    { key: 'billingAddress', label: 'ADDRESS' },
    { key: 'billingCity', label: 'CITY' },
    { key: 'billingState', label: 'STATE' },
    { key: 'billingZip', label: 'ZIP' },
    { key: 'billingContact', label: 'Billing Contact' },
    { key: 'mainPhone', label: 'Main Phone' },
    { key: 'fax', label: 'Fax' },
    { key: 'notes', label: 'Notes', multiline: true, rows: 4 }
  ],
  1: [ // Technicians
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'address1', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'Zip' },
    { key: 'experienceLevel', label: 'Expertise Level' },
    { key: 'isActive', label: 'Active', type: 'checkbox' },
    { key: 'notes', label: 'Notes', multiline: true, rows: 4 }
  ],
  2: [ // Users
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'username', label: 'Username', required: true },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password' },
    { key: 'isAdmin', label: 'Administrator', type: 'checkbox' }
  ]
};

const PERSON_TYPES = ['doctors', 'technicians', 'users'];

const EmailManager = ({ emails, onChange, editMode }) => {
  const addEmail = () => {
    const newEmail = {
      email: '',
      type: 'general',
      isPrimary: false,
      label: ''
    };
    onChange([...emails, newEmail]);
  };

  const updateEmail = (index, field, value) => {
    const updatedEmails = emails.map((email, i) =>
      i === index ? { ...email, [field]: value } : email
    );
    onChange(updatedEmails);
  };

  const removeEmail = (index) => {
    onChange(emails.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Contact Emails</Typography>
        {editMode && (
          <Button startIcon={<Add />} onClick={addEmail} size="small">
            Add Email
          </Button>
        )}
      </Box>

      {emails.length === 0 && !editMode && (
        <Typography color="text.secondary">No emails added</Typography>
      )}

      <Stack spacing={2}>
        {emails.map((email, index) => (
          <Card key={index} variant="outlined">
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Email"
                    value={email.email || ''}
                    onChange={(e) => updateEmail(index, 'email', e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                    sx={{ flex: 1 }}
                    type="email"
                  />

                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={email.type || 'general'}
                      onChange={(e) => updateEmail(index, 'type', e.target.value)}
                      disabled={!editMode}
                      label="Type"
                    >
                      <MenuItem value="scheduling">Scheduling</MenuItem>
                      <MenuItem value="billing">Billing</MenuItem>
                      <MenuItem value="general">General</MenuItem>
                    </Select>
                  </FormControl>

                  {editMode && (
                    <IconButton onClick={() => removeEmail(index)} color="error">
                      <Remove />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Label (optional)"
                    value={email.label || ''}
                    onChange={(e) => updateEmail(index, 'label', e.target.value)}
                    InputProps={{ readOnly: !editMode }}
                    sx={{ flex: 1 }}
                    placeholder="e.g., Office Manager, After Hours"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={email.isPrimary || false}
                        onChange={(e) => updateEmail(index, 'isPrimary', e.target.checked)}
                        disabled={!editMode}
                      />
                    }
                    label="Primary"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

const PersonDetails = ({
  person,
  isAdding,
  editMode,
  personType,
  onEdit,
  onSave,
  onDelete,
  onCancel
}) => {
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const isMobile = useMediaQuery('(max-width:800px)');
  const { tags } = useScheduling();

  useEffect(() => {
    if (person) {
      const data = {
        ...person,
        emails: person.emails || [],
        tags: person.tags || []
      };
      setFormData(data);
      setOriginalData(data);
    } else {
      setFormData({
        emails: [],
        tags: []
      });
      setOriginalData({
        emails: [],
        tags: []
      });
    }
    setValidationErrors({});
    setError(null);
  }, [person]);

  const validateForm = () => {
    const errors = {};
    const fields = FIELD_CONFIGS[personType];
    
    fields.forEach(({ key, required }) => {
      if (required && !formData[key]) {
        errors[key] = `${key} is required`;
      }
    });

    if (personType === 2) {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const personTypeEndpoint = PERSON_TYPES[personType];
      let dataToSend = { ...formData };

      if (personType === 2) {
        if (formData.password) {
          dataToSend.password = formData.password;
        }
        delete dataToSend.confirmPassword;
      }

      let response;

      if (isAdding) {
        response = await axios.post(`/${personTypeEndpoint}`, dataToSend);
      } else {
        response = await axios.put(`/${personTypeEndpoint}/${dataToSend.id}`, dataToSend);
      }

      setSuccessMessage(`Successfully ${isAdding ? 'added' : 'updated'} ${formData.name || formData.customer}`);
      onSave(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'An error occurred while saving. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${person.name || formData.customer}?`)) {
      setLoading(true);
      setError(null);
      
      try {
        const personTypeEndpoint = PERSON_TYPES[personType];
        await axios.delete(`/${personTypeEndpoint}/${formData.id}`);
        setSuccessMessage(`Successfully deleted ${formData.name || formData.customer}`);
        onDelete(formData.id);
      } catch (err) {
        setError(
          err.response?.data?.message || 
          'An error occurred while deleting. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));

    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setValidationErrors({});
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  if (!person && !isAdding) {
    return (
      <Box sx={{ width: '40%', pl: 2, pr: 2 }}>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Select a person to view details or add a new one
        </Typography>
      </Box>
    );
  }

  const fields = FIELD_CONFIGS[personType];

  return (
    <Box sx={{ width: isMobile ? '100%' : '45%', pl: 2, pr: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, pt: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {isAdding ? `Add New ${PERSON_TYPES[personType].slice(0, -1)}` : formData.name || formData.customer}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: isAdding ? 'flex-end' : 'space-between', gap: 1, mb: 1 }}>
          {!isAdding && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              startIcon={<Delete />}
              disabled={loading}
            >
              DELETE
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {editMode || isAdding ? (
              <>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  CANCEL
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  disabled={loading}
                >
                  {loading ? 'SAVING...' : 'SAVE'}
                </Button>
              </>
            ) : (
              <Button variant="outlined" onClick={onEdit} startIcon={<Edit />}>
                EDIT
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1, pt: 2 }}>

      {fields.map(({ key, label, required, type, multiline, rows }) =>
        type === 'checkbox' ? (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={formData[key] || false}
                onChange={(e) => handleFieldChange(key, e.target.checked)}
                disabled={!editMode}
              />
            }
            label={label}
            sx={{ mb: 2 }}
          />
        ) : (
          <TextField
            key={key}
            fullWidth
            label={label}
            value={formData[key] || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            InputProps={{
              readOnly: !editMode,
            }}
            required={required}
            error={!!validationErrors[key]}
            helperText={validationErrors[key]}
            type={type || 'text'}
            multiline={multiline}
            rows={rows}
            sx={{
              mb: 2,
              '& .MuiInputBase-input.Mui-readOnly': {
                color: 'text.primary',
              },
            }}
          />
        )
      )}

        {/* Tags Section */}
        {(personType === 0 || personType === 1 || personType === 2) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Autocomplete
              multiple
              options={tags.filter(tag =>
                tag.appliesTo.includes(personType === 0 ? 'doctor' : personType === 1 ? 'technician' : 'user')
              )}
              getOptionLabel={(option) => option.name}
              value={formData.tags || []}
              onChange={(event, newValue) => {
                handleFieldChange('tags', newValue);
              }}
              disabled={!editMode && !isAdding}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  helperText="Categorize this record with tags"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option.id}
                    label={option.name}
                    {...getTagProps({ index })}
                    style={{
                      backgroundColor: option.color,
                      color: '#fff',
                      fontWeight: 500
                    }}
                  />
                ))
              }
              sx={{ mb: 2 }}
            />
          </>
        )}

        {personType === 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <EmailManager
              emails={formData.emails || []}
              onChange={(emails) => handleFieldChange('emails', emails)}
              editMode={editMode}
            />
          </>
        )}
        <Box sx={{ mb: 2 }} />
      </Box>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PersonDetails;