import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Divider
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import moment from 'moment';

/**
 * Component for displaying and editing per-technician completion data
 * @param {Array} technicians - Selected technicians for the event
 * @param {Object} completionData - Object keyed by technicianId with completion data
 * @param {Function} onChange - Callback when completion data changes
 */
function TechnicianCompletionFields({ technicians, completionData = {}, onChange }) {
  // Filter out the "All Technicians" option
  const actualTechnicians = technicians.filter(tech => tech.id !== 'all');

  if (actualTechnicians.length === 0) {
    return null;
  }

  const handleFieldChange = (technicianId, field, value) => {
    const updated = {
      ...completionData,
      [technicianId]: {
        ...(completionData[technicianId] || {}),
        [field]: value
      }
    };
    onChange(updated);
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        Post-Completion Data (Per Technician)
      </Typography>

      {actualTechnicians.map((tech, index) => {
        const techData = completionData[tech.id] || {};

        return (
          <Box key={tech.id}>
            {index > 0 && <Divider sx={{ my: 2 }} />}

            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'primary.main' }}>
              {tech.name}
            </Typography>

            <Box sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              '& > *': { flex: '1 1 200px', minWidth: '150px' }
            }}>
              <TimePicker
                label="Clock In"
                value={techData.clockInTime || null}
                onChange={(time) => handleFieldChange(tech.id, 'clockInTime', time)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />

              <TimePicker
                label="Clock Out"
                value={techData.clockOutTime || null}
                onChange={(time) => handleFieldChange(tech.id, 'clockOutTime', time)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />

              <TextField
                label="Number of Cases"
                type="number"
                size="small"
                fullWidth
                value={techData.numberOfCases || ''}
                onChange={(e) => handleFieldChange(tech.id, 'numberOfCases', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
}

export default TechnicianCompletionFields;
