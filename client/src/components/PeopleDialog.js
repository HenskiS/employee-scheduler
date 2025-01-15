import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, useMediaQuery } from '@mui/material';
import { Close, ArrowBack } from '@mui/icons-material';
import Sidebar from './Sidebar';
import PeopleList from './PeopleList';
import PersonDetails from './PersonDetails';
import { useScheduling } from './SchedulingContext';

const PeopleDialog = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showingDetails, setShowingDetails] = useState(false);
  
  const { doctors, technicians, users, refreshData } = useScheduling();
  const isMobile = useMediaQuery('(max-width:800px)');

  const getCurrentPeople = () => {
    const types = ['doctors', 'technicians', 'users'];
    const peopleMap = {
      doctors,
      technicians,
      users
    };
    return peopleMap[types[tab]] || [];
  };

  const handleTabChange = (newValue) => {
    setTab(newValue);
    setSelectedPerson(null);
    setEditMode(false);
    setIsAdding(false);
    setShowingDetails(false);
  };

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    setEditMode(false);
    if (isMobile) {
      setShowingDetails(true);
    }
  };

  const handleAddNew = () => {
    setSelectedPerson(null);
    setIsAdding(true);
    setEditMode(true);
    if (isMobile) {
      setShowingDetails(true);
    }
  };

  const handleBack = () => {
    setShowingDetails(false);
    setSelectedPerson(null);
    setIsAdding(false);
    setEditMode(false);
  };

  const handleSave = async (savedPerson) => {
    try {
      setSelectedPerson({...savedPerson});
      setEditMode(false);
      setIsAdding(false);
      await refreshData();
      if (isMobile) {
        setShowingDetails(false);
      }
    } catch (error) {
      console.error('Error handling save:', error);
    }
  };

  const handleDelete = async () => {
    await refreshData();
    setSelectedPerson(null);
    setIsAdding(false);
    setEditMode(false);
    if (isMobile) {
      setShowingDetails(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider',
        padding: '8px 16px'
      }}>
        {isMobile && showingDetails && (
          <IconButton onClick={handleBack} size="small">
            <ArrowBack />
          </IconButton>
        )}
        <span>People</span>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ marginLeft: 'auto' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        height: isMobile ? 'calc(100vh - 64px)' : '80vh',
        display: 'flex', 
        flexDirection: 'column',
        p: 0 
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexGrow: 1,
          overflow: 'hidden',
          '& > *': { minWidth: 0 }
        }}>
          {(!isMobile || !showingDetails) && (
            <>
              <Sidebar tab={tab} onTabChange={handleTabChange} />
              <PeopleList
                people={getCurrentPeople()}
                searchTerm={searchTerm}
                selectedPerson={selectedPerson}
                onSearchChange={setSearchTerm}
                onPersonSelect={handlePersonSelect}
                onAddNew={handleAddNew}
              />
            </>
          )}
          {(!isMobile || showingDetails) && (
            <PersonDetails
              person={selectedPerson}
              isAdding={isAdding}
              editMode={editMode}
              personType={tab}
              onEdit={() => setEditMode(true)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleDialog;