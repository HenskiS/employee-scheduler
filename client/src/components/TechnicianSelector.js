import React from 'react';
import {
  Box,
  Chip,
  Autocomplete,
  TextField,
  Typography
} from '@mui/material';

const TechnicianSelector = ({ selectedTechnicians, availableTechnicians, onChange }) => {
  // Filter out already selected technicians from available options
  const remainingTechnicians = availableTechnicians?.filter(
    tech => !selectedTechnicians?.find(selected => selected.id === tech.id)
  );

  const handleTechnicianSelect = (event, newValue) => {
    if (newValue) {
      onChange([...selectedTechnicians, newValue]);
    }
  };

  const handleRemoveTechnician = (technicianId) => {
    onChange(selectedTechnicians.filter(t => t.id !== technicianId));
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Assigned Technicians
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        {selectedTechnicians?.map(tech => (
          <Chip
            key={tech.id}
            label={tech.name}
            onDelete={() => handleRemoveTechnician(tech.id)}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>

      <Autocomplete
        options={remainingTechnicians}
        getOptionLabel={(option) => option.name}
        onChange={handleTechnicianSelect}
        value={null}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={remainingTechnicians.length === 0 ? "No more technicians available" : "Search technicians"}
            fullWidth
          />
        )}
        noOptionsText="No matching technicians found"
        disabled={remainingTechnicians.length === 0}
      />
    </Box>
  );
};

export default TechnicianSelector;