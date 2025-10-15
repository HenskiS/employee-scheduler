import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography
} from '@mui/material';
import axios from '../api/axios';
import { useScheduling } from './SchedulingContext';

function SettingsDialog({ open, onClose }) {
  const { maxJobNumber, jobNumberOptions } = useScheduling();
  const [newMaxJobNumber, setNewMaxJobNumber] = useState(maxJobNumber);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNewMaxJobNumber(maxJobNumber);
  }, [maxJobNumber, open]);

  const handleSave = async () => {
    // Validate input
    const num = parseInt(newMaxJobNumber, 10);
    if (isNaN(num) || num < 1) {
      setError('Please enter a valid number greater than 0');
      return;
    }

    if (num > 100) {
      setError('Maximum job number cannot exceed 100');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put('/settings', { maxJobNumber: num });
      setSuccess('Settings saved successfully! Refresh the page to see changes.');

      // Close dialog after a brief delay
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to fetch new settings
      }, 1500);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setNewMaxJobNumber(maxJobNumber);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Application Settings</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure the maximum job number for your scheduling system. This determines
            how many columns appear in the day view and the available job numbers when creating events.
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="Maximum Job Number"
            type="number"
            fullWidth
            value={newMaxJobNumber}
            onChange={(e) => setNewMaxJobNumber(e.target.value)}
            inputProps={{ min: 1, max: 100 }}
            helperText={`Current: ${maxJobNumber} | Valid range: 1-100`}
            disabled={saving}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            Note: Changing this value will require a page refresh to take effect.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || parseInt(newMaxJobNumber) === maxJobNumber}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsDialog;
