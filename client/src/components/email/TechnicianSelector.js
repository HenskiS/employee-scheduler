import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  ListItemText, 
  Box, 
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  ListSubheader,
  Button
} from '@mui/material';

const TechnicianSelector = ({ 
  technicians, 
  selectedTechnicians, 
  setSelectedTechnicians, 
  technicianOption, 
  onTechnicianOptionChange 
}) => {
  const handleTechnicianOptionChange = (e) => {
    onTechnicianOptionChange(e.target.value);
  };

  const handleTechnicianSelectionChange = (e) => {
    setSelectedTechnicians(e.target.value);
  };

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 48 * 4.5 + 8,
        width: 250,
      },
    },
    // Force menu to always open at the top of the list
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'left',
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'left',
    },
    // Ensure first item is visible/scrolled to
    disableAutoFocusItem: true,
  };

  // Sort technicians: active first, then inactive
  const sortedTechnicians = [...technicians].sort((a, b) => {
    // First sort by active status (active first)
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    
    // If same active status, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Technicians</Typography>
      
      <RadioGroup
        value={technicianOption}
        onChange={handleTechnicianOptionChange}
      >
        <FormControlLabel 
          value="allActive" 
          control={<Radio />} 
          label="All Active Technicians" 
        />
        <FormControlLabel 
          value="all" 
          control={<Radio />} 
          label="All Technicians" 
        />
        <FormControlLabel 
          value="selected" 
          control={<Radio />} 
          label="Selected Technicians" 
        />
      </RadioGroup>
      
      {technicianOption === 'selected' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select individual technicians below:
            </Typography>
            <Button 
              size="small" 
              onClick={() => setSelectedTechnicians([])}
              variant="outlined"
            >
              Clear Selection
            </Button>
          </Box>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select Technicians</InputLabel>
            <Select
              multiple
              value={selectedTechnicians}
              onChange={handleTechnicianSelectionChange}
              renderValue={(selected) => selected.map(tech => tech.name).join(', ')}
              label="Select Technicians"
              MenuProps={MenuProps}
            >
              {/* Active Technicians */}
              <ListSubheader>Active Technicians</ListSubheader>
              {sortedTechnicians.filter(tech => tech.isActive).map((technician) => (
                <MenuItem key={technician.name} value={technician}>
                  <Checkbox checked={selectedTechnicians.some(tech => tech.name === technician.name)} />
                  <ListItemText 
                    primary={technician.name} 
                    secondary={technician.email || 'No email'} 
                  />
                </MenuItem>
              ))}
              
              {/* Divider between active and inactive */}
              {sortedTechnicians.some(tech => !tech.isActive) && (
                <ListSubheader>Inactive Technicians</ListSubheader>
              )}
              
              {/* Inactive Technicians */}
              {sortedTechnicians.filter(tech => !tech.isActive).map((technician) => (
                <MenuItem key={technician.name} value={technician} sx={{ opacity: 0.7 }}>
                  <Checkbox checked={selectedTechnicians.some(tech => tech.name === technician.name)} />
                  <ListItemText 
                    primary={technician.name} 
                    primaryTypographyProps={{ 
                      sx: { fontStyle: 'italic' } 
                    }}
                    secondary={technician.email || 'No email'}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}
    </Box>
  );
};

export default TechnicianSelector;