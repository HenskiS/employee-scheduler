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
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent
} from '@mui/material';
import { Add, Edit, Delete, Save, Cancel } from '@mui/icons-material';
import axios from '../api/axios';
import { useScheduling } from './SchedulingContext';

function SettingsDialog({ open, onClose }) {
  const { maxJobNumber, jobNumberOptions, tags, refreshData } = useScheduling();
  const [newMaxJobNumber, setNewMaxJobNumber] = useState(maxJobNumber);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Tag management state
  const [editingTagId, setEditingTagId] = useState(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagFormData, setTagFormData] = useState({
    name: '',
    color: '#808080',
    appliesTo: ['event']
  });

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
    setIsAddingTag(false);
    setEditingTagId(null);
    setTagFormData({ name: '', color: '#808080', appliesTo: ['event'] });
    onClose();
  };

  // Tag management handlers
  const handleAddTagClick = () => {
    setIsAddingTag(true);
    setTagFormData({ name: '', color: '#808080', appliesTo: ['event'] });
  };

  const handleEditTagClick = (tag) => {
    setEditingTagId(tag.id);
    setTagFormData({
      name: tag.name,
      color: tag.color,
      appliesTo: tag.appliesTo
    });
  };

  const handleCancelTagEdit = () => {
    setIsAddingTag(false);
    setEditingTagId(null);
    setTagFormData({ name: '', color: '#808080', appliesTo: ['event'] });
  };

  const handleSaveTag = async () => {
    if (!tagFormData.name.trim()) {
      setError('Tag name is required');
      return;
    }

    if (tagFormData.appliesTo.length === 0) {
      setError('Tag must apply to at least one entity type');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isAddingTag) {
        await axios.post('/tags', tagFormData);
        setSuccess('Tag created successfully!');
      } else if (editingTagId) {
        await axios.put(`/tags/${editingTagId}`, tagFormData);
        setSuccess('Tag updated successfully!');
      }

      await refreshData();
      handleCancelTagEdit();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving tag:', err);
      setError(err.response?.data?.error || 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? This will remove it from all associated records.')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await axios.delete(`/tags/${tagId}`);
      setSuccess('Tag deleted successfully!');
      await refreshData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError(err.response?.data?.error || 'Failed to delete tag');
    } finally {
      setSaving(false);
    }
  };

  const handleAppliesToChange = (entityType) => {
    const newAppliesTo = tagFormData.appliesTo.includes(entityType)
      ? tagFormData.appliesTo.filter(t => t !== entityType)
      : [...tagFormData.appliesTo, entityType];
    setTagFormData({ ...tagFormData, appliesTo: newAppliesTo });
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

        {/* Tag Management Section */}
        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Tag Management</Typography>
            {!isAddingTag && !editingTagId && (
              <Button
                startIcon={<Add />}
                variant="outlined"
                size="small"
                onClick={handleAddTagClick}
                disabled={saving}
              >
                Add Tag
              </Button>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create and manage tags for categorizing events, doctors, and technicians.
          </Typography>

          {/* Add/Edit Tag Form */}
          {(isAddingTag || editingTagId) && (
            <Card sx={{ mb: 2, bgcolor: 'action.hover' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {isAddingTag ? 'New Tag' : 'Edit Tag'}
                </Typography>

                <TextField
                  label="Tag Name"
                  value={tagFormData.name}
                  onChange={(e) => setTagFormData({ ...tagFormData, name: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                  disabled={saving}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TextField
                    label="Color"
                    type="color"
                    value={tagFormData.color}
                    onChange={(e) => setTagFormData({ ...tagFormData, color: e.target.value })}
                    size="small"
                    sx={{ width: 120 }}
                    disabled={saving}
                  />
                  <Chip
                    label={tagFormData.name || 'Preview'}
                    style={{
                      backgroundColor: tagFormData.color,
                      color: '#fff',
                      fontWeight: 500
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>Applies To:</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={tagFormData.appliesTo.includes('event')}
                        onChange={() => handleAppliesToChange('event')}
                        disabled={saving}
                      />
                    }
                    label="Events"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={tagFormData.appliesTo.includes('doctor')}
                        onChange={() => handleAppliesToChange('doctor')}
                        disabled={saving}
                      />
                    }
                    label="Doctors"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={tagFormData.appliesTo.includes('technician')}
                        onChange={() => handleAppliesToChange('technician')}
                        disabled={saving}
                      />
                    }
                    label="Technicians"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={tagFormData.appliesTo.includes('user')}
                        onChange={() => handleAppliesToChange('user')}
                        disabled={saving}
                      />
                    }
                    label="Users"
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Save />}
                    variant="contained"
                    size="small"
                    onClick={handleSaveTag}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    size="small"
                    onClick={handleCancelTagEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Tags List */}
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {tags && tags.length > 0 ? (
              tags.map((tag) => (
                <ListItem
                  key={tag.id}
                  secondaryAction={
                    editingTagId !== tag.id && (
                      <Box>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleEditTagClick(tag)}
                          disabled={saving || isAddingTag || editingTagId}
                          sx={{ mr: 1 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDeleteTag(tag.id)}
                          disabled={saving || isAddingTag || editingTagId}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  }
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: editingTagId === tag.id ? 'action.selected' : 'inherit'
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={tag.name}
                          size="small"
                          style={{
                            backgroundColor: tag.color,
                            color: '#fff',
                            fontWeight: 500
                          }}
                          sx={{
                            height: '22px',
                            '& .MuiChip-label': {
                              padding: '0 8px',
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Applies to: {tag.appliesTo.join(', ')}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No tags yet. Click "Add Tag" to create one.
              </Typography>
            )}
          </List>
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
