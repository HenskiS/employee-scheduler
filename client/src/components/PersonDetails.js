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
  FormControlLabel
} from '@mui/material';
import { Save, Edit, Delete } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';
import axios from '../api/axios';

const FIELD_CONFIGS = {
  0: [ // Doctors
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'address1', label: 'Address1' },
    { key: 'address2', label: 'Address2' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip', label: 'Zip' },
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

const PersonDetails = ({
  person,
  isAdding,
  editMode,
  personType,
  onEdit,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const isMobile = useMediaQuery('(max-width:800px)');

  useEffect(() => {
    setFormData(person || {});
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

      setSuccessMessage(`Successfully ${isAdding ? 'added' : 'updated'} ${formData.name}`);
      onSave(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'An error occurred while saving. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${person.name}?`)) {
      setLoading(true);
      setError(null);
      
      try {
        const personTypeEndpoint = PERSON_TYPES[personType];
        await axios.delete(`/${personTypeEndpoint}/${formData.id}`);
        setSuccessMessage(`Successfully deleted ${formData.name}`);
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
    <Box sx={{ width: isMobile ? '100%' : '45%', pl: 2, pr: 2, overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
        {isAdding ? `Add New ${PERSON_TYPES[personType].slice(0, -1)}` : formData.name}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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

      <Box sx={{ display: 'flex', justifyContent: isAdding ? 'flex-end' : 'space-between', mt: 2, mb: 2 }}>
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
        {editMode || isAdding ? (
          <Button 
            variant="contained" 
            onClick={handleSave} 
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            disabled={loading}
          >
            {loading ? 'SAVING...' : 'SAVE'}
          </Button>
        ) : (
          <Button variant="outlined" onClick={onEdit} startIcon={<Edit />}>
            EDIT
          </Button>
        )}
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