// components/PersonDetails.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Divider,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Save, Edit } from '@mui/icons-material';
import axios from '../api/axios';

const FIELD_CONFIGS = {
  0: [ // Doctors
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'address1', label: 'Address1', required: true },
    { key: 'address2', label: 'Address2' },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'zip', label: 'Zip' }
  ],
  1: [ // Technicians
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'experienceLevel', label: 'Expertise Level' }
  ],
  2: [ // Users
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'username', label: 'Username', required: true }
  ]
};

const PERSON_TYPES = ['doctors', 'technicians', 'users'];

const PersonDetails = ({
  person,
  isAdding,
  editMode,
  personType,
  onEdit,
  onSave
}) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

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
      let response;

      if (isAdding) {
        response = await axios.post(`/api/${personTypeEndpoint}`, formData);
      } else {
        response = await axios.put(`/api/${personTypeEndpoint}/${formData.id}`, formData);
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

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear validation error when field is modified
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
    <Box sx={{ width: '40%', pl: 2, pr: 2, overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
        {isAdding ? `Add New ${PERSON_TYPES[personType].slice(0, -1)}` : formData.name}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {fields.map(({ key, label, required }) => (
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
          sx={{
            mb: 2,
            '& .MuiInputBase-input.Mui-readOnly': {
              color: 'text.primary',
            },
          }}
        />
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
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