import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { Search, Close, Save, Edit } from '@mui/icons-material';

const PeopleDialog = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const tabs = ['DOCTORS', 'TECHNICIANS', 'USERS'];

  // Mock data - replace with your actual data
  const people = {
    DOCTORS: [
      { id: 1, name: 'Dr. Smith', speciality: 'Cardiology', phone: '123-456-7890', email: 'smith@example.com', address: '123 Main St', license: 'MD12345', yearsOfExperience: 10 },
      { id: 2, name: 'Dr. Johnson', speciality: 'Neurology', phone: '098-765-4321', email: 'johnson@example.com', address: '456 Oak Ave', license: 'MD67890', yearsOfExperience: 15 },
    ],
    TECHNICIANS: [
      { id: 3, name: 'Tech Brown', skill: 'X-ray', phone: '111-222-3333', email: 'brown@example.com', certifications: ['X-ray Tech', 'MRI Tech'], yearsOfExperience: 5 },
      { id: 4, name: 'Tech Davis', skill: 'MRI', phone: '444-555-6666', email: 'davis@example.com', certifications: ['MRI Tech', 'CT Tech'], yearsOfExperience: 8 },
    ],
    USERS: [
      { id: 5, name: 'John Doe', email: 'john@example.com', phone: '777-888-9999', role: 'Admin', department: 'IT', hireDate: '2020-01-15' },
      { id: 6, name: 'Jane Smith', email: 'jane@example.com', phone: '000-111-2222', role: 'Manager', department: 'HR', hireDate: '2018-05-20' },
    ],
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setSelectedPerson(null);
    setEditMode(false);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    setEditMode(false);
  };

  const handleSave = () => {
    // Implement save logic here
    console.log('Saving:', selectedPerson);
    setEditMode(false);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const filteredPeople = people[tabs[tab]].filter((person) =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPersonDetails = () => {
    if (!selectedPerson) return null;

    const fields = Object.entries(selectedPerson).filter(([key]) => key !== 'id');

    return fields.map(([key, value]) => (
      <TextField
        key={key}
        fullWidth
        label={key.charAt(0).toUpperCase() + key.slice(1)}
        value={value}
        onChange={(e) => setSelectedPerson({ ...selectedPerson, [key]: e.target.value })}
        InputProps={{
          readOnly: !editMode,
        }}
        sx={{
          mb: 2,
          '& .MuiInputBase-input.Mui-readOnly': {
            color: 'text.primary',
          },
        }}
      />
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        People
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ height: '80vh', display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ width: '20%', borderRight: 1, borderColor: 'divider', pr: 2, overflowY: 'auto' }}>
            <Tabs
              orientation="vertical"
              value={tab}
              onChange={handleTabChange}
              sx={{ borderRight: 1, borderColor: 'divider' }}
              TabIndicatorProps={{ sx: { left: 0, right: 'auto' } }}
            >
              {tabs.map((tabLabel, index) => (
                <Tab 
                  key={index} 
                  label={tabLabel} 
                  sx={{ 
                    alignItems: 'flex-start', 
                    minWidth: 'unset',
                    fontSize: '0.875rem',
                    fontWeight: tab === index ? 'bold' : 'normal',
                    color: tab === index ? 'primary.main' : 'text.primary',
                  }} 
                />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', px: 2, display: 'flex', flexDirection: 'column' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
              sx={{ mb: 2, mt: 2 }}
            />
            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {filteredPeople.map((person) => (
                <ListItem
                  key={person.id}
                  button
                  onClick={() => handlePersonSelect(person)}
                  selected={selectedPerson?.id === person.id}
                  sx={{
                    backgroundColor: selectedPerson?.id === person.id ? 'action.selected' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText 
                    primary={person.name} 
                    primaryTypographyProps={{
                      fontWeight: selectedPerson?.id === person.id ? 'bold' : 'normal',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ width: '40%', pl: 2, pr: 2, overflowY: 'auto' }}>
            {selectedPerson ? (
              <>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                  {selectedPerson.name}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {renderPersonDetails()}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
                  {editMode ? (
                    <Button variant="contained" onClick={handleSave} startIcon={<Save />}>
                      SAVE
                    </Button>
                  ) : (
                    <Button variant="outlined" onClick={handleEdit} startIcon={<Edit />}>
                      EDIT
                    </Button>
                  )}
                </Box>
              </>
            ) : (
              <Typography variant="body1" sx={{ mt: 2 }}>
                Select a person to view details
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleDialog;