import React, { useState } from 'react';
import {
  Box,
  Chip,
  Autocomplete,
  TextField,
  Typography
} from '@mui/material';

const TechnicianSelector = ({ selectedTechnicians, availableTechnicians, onChange }) => {
  // State to manage the input value in the Autocomplete
  const [inputValue, setInputValue] = useState('');
  
  // Create a special "All Technicians" option
  const allTechniciansOption = { id: 'all', name: 'All', isAllOption: true };
  
  // Check if "All Technicians" is selected
  const isAllSelected = selectedTechnicians?.some(tech => tech.id === 'all');
  
  // Determine available options for the dropdown
  const availableOptions = isAllSelected 
    ? [allTechniciansOption] 
    : [allTechniciansOption, ...availableTechnicians?.filter(
        tech => !selectedTechnicians?.find(selected => selected.id === tech.id)
      )];

  const handleTechnicianSelect = (event, newValue) => {
    if (!newValue) return;
    
    // If "All Technicians" is selected, replace all selections with just this option
    if (newValue.id === 'all') {
      onChange([allTechniciansOption]);
    } else {
      // If a regular technician is selected, and "All" was previously selected,
      // remove the "All" option and add the selected technician
      if (isAllSelected) {
        onChange([newValue]);
      } else {
        onChange([...selectedTechnicians, newValue]);
      }
    }
    
    // Clear the input value after selection
    setInputValue('');
  };

  const handleRemoveTechnician = (technicianId) => {
    onChange(selectedTechnicians.filter(t => t.id !== technicianId));
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Assigned Technicians
        </Typography>
        
        {selectedTechnicians?.length > 0 && (
          <Chip
            key="clear-all-chip"
            label="Clear All"
            size="small"
            color="primary"
            onClick={() => onChange([])}
            sx={{ fontSize: '0.75rem', marginLeft: '10px' }}
          />
        )}
      </Box>
      
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
        options={availableOptions}
        getOptionLabel={(option) => option.name}
        onChange={handleTechnicianSelect}
        value={null}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={availableOptions.length <= 1 ? "No more technicians available" : "Technicians"}
            fullWidth
          />
        )}
        noOptionsText="No matching technicians found"
        disabled={availableOptions.length <= 1}
        clearOnBlur={false}
      />
    </Box>
  );
};

export default TechnicianSelector;