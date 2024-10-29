// PeopleDialog.js
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import Sidebar from './Sidebar';
import PeopleList from './PeopleList';
import PersonDetails from './PersonDetails';
import { fetchPeople } from '../api/peopleApi';

const PeopleDialog = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [people, setPeople] = useState({
    doctors: [],
    technicians: [],
    users: []
  });

  // Debug logging for state changes
  /*useEffect(() => {
    console.log('People state updated:', people);
    console.log('Selected person:', selectedPerson);
  }, [people, selectedPerson]);*/

  const loadData = async () => {
    try {
      const data = await fetchPeople();
      console.log('Fetched data:', data);
      
      // If we have a selected person, find them in the new data
      if (selectedPerson) {
        const types = ['doctors', 'technicians', 'users'];
        const currentType = types[tab];
        const updatedPerson = data[currentType].find(p => p.id === selectedPerson.id);
        if (updatedPerson) {
          console.log('Found updated person:', updatedPerson);
          setSelectedPerson(updatedPerson);
        }
      }
      
      setPeople(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (newValue) => {
    setTab(newValue);
    setSelectedPerson(null);
    setEditMode(false);
    setIsAdding(false);
  };

  const getCurrentPeople = () => {
    const types = ['doctors', 'technicians', 'users'];
    return people[types[tab]] || [];
  };

  const handleSave = async (savedPerson) => {
    console.log('Handling save for person:', savedPerson);
    const types = ['doctors', 'technicians', 'users'];
    const currentType = types[tab];
    
    try {
      // Update the selected person with the new data
      console.log('Setting selected person:', savedPerson);
      setSelectedPerson({...savedPerson});
      
      setEditMode(false);
      setIsAdding(false);

      // Refresh data in background
      const newData = await fetchPeople();
      console.log('Fetched new data after save:', newData);
      
      // Update with fresh data while preserving selection
      setPeople(newData);
      const refreshedPerson = newData[currentType].find(p => p.id === savedPerson.id);
      if (refreshedPerson) {
        console.log('Setting refreshed person:', refreshedPerson);
        setSelectedPerson(refreshedPerson);
      }
    } catch (error) {
      console.error('Error handling save:', error);
    }
  };

  const handleDelete = async (id) => {
    const newData = await fetchPeople();
    setPeople(newData);
    setSelectedPerson(null);
    setIsAdding(false);
    setEditMode(false);
  }

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
          <Sidebar tab={tab} onTabChange={handleTabChange} />
          <PeopleList
            people={getCurrentPeople()}
            searchTerm={searchTerm}
            selectedPerson={selectedPerson}
            onSearchChange={setSearchTerm}
            onPersonSelect={person => {
              //console.log('Selecting person:', person);
              setSelectedPerson(person);
              setEditMode(false);
            }}
            onAddNew={() => {
              setSelectedPerson(null);
              setIsAdding(true);
              setEditMode(true);
            }}
          />
          <PersonDetails
            person={selectedPerson}
            isAdding={isAdding}
            editMode={editMode}
            personType={tab}
            onEdit={() => setEditMode(true)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleDialog;