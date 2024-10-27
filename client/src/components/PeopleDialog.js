import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Tabs, Tab, TextField, 
  List, ListItem, ListItemText, Button, IconButton, Box, Typography, Divider } from '@mui/material';
import { Search, Close, Save, Edit, Add } from '@mui/icons-material';
import axios from '../api/axios';

const PeopleDialog = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState([]);
  const tabs = ['DOCTORS', 'TECHNICIANS', 'USERS'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorsResponse = await axios.get('/api/doctors');
        setDoctors(doctorsResponse.data);

        const techniciansResponse = await axios.get('/api/technicians');
        setTechnicians(techniciansResponse.data);

        const usersResponse = await axios.get('/api/users');
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setSelectedPerson(null);
    setEditMode(false);
    setIsAdding(false);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    setEditMode(false);
    setIsAdding(false);
  };

  const handleSave = async () => {
    console.log('Saving:', selectedPerson);
    setEditMode(false);
  
    try {
      let endpoint;
      if (isAdding) {
        if (tab === 0) {
          endpoint = '/api/doctors';
          const response = await axios.post(endpoint, selectedPerson);
          setDoctors([...doctors, response.data]);
        } else if (tab === 1) {
          endpoint = '/api/technicians';
          const response = await axios.post(endpoint, selectedPerson);
          setTechnicians([...technicians, response.data]);
        } else if (tab === 2) {
          endpoint = '/api/users';
          const response = await axios.post(endpoint, selectedPerson);
          setUsers([...users, response.data]);
        }
        console.log('Successfully added new person');
      } else {
        if (tab === 0) {
          endpoint = `/api/doctors/${selectedPerson.id}`;
          await axios.put(endpoint, selectedPerson);
          setDoctors(doctors.map(doc => doc.id === selectedPerson.id ? selectedPerson : doc));
        } else if (tab === 1) {
          endpoint = `/api/technicians/${selectedPerson.id}`;
          await axios.put(endpoint, selectedPerson);
          setTechnicians(technicians.map(tech => tech.id === selectedPerson.id ? selectedPerson : tech));
        } else if (tab === 2) {
          endpoint = `/api/users/${selectedPerson.id}`;
          await axios.put(endpoint, selectedPerson);
          setUsers(users.map(user => user.id === selectedPerson.id ? selectedPerson : user));
        }
        console.log('Successfully updated person');
      }
      setIsAdding(false);
    } catch (error) {
      console.error('Error saving person:', error);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleAdd = () => {
    setSelectedPerson({});
    setEditMode(true);
    setIsAdding(true);
  };

  const getCurrentPeople = () => {
    switch(tab) {
      case 0: return doctors;
      case 1: return technicians;
      case 2: return users;
      default: return [];
    }
  };

  const filteredPeople = getCurrentPeople().filter((person) =>
    person.name && person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPersonDetails = () => {
    if (!selectedPerson) return null;

    const fields = isAdding ? ['name', 'email', 'phone'] : Object.keys(selectedPerson).filter(key => key !== 'id');

    return fields.map((key) => (
      <TextField
        key={key}
        fullWidth
        label={key.charAt(0).toUpperCase() + key.slice(1)}
        value={selectedPerson[key] || ''}
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
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleAdd}
              sx={{ mt: 2, mb: 2 }}
            >
              Add New
            </Button>
          </Box>
          <Box sx={{ width: '40%', pl: 2, pr: 2, overflowY: 'auto' }}>
            {selectedPerson || isAdding ? (
              <>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                  {isAdding ? 'Add New Person' : selectedPerson.name}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {renderPersonDetails()}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
                  {editMode || isAdding ? (
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
                Select a person to view details or add a new one
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleDialog;