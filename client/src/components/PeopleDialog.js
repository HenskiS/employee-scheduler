import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, useMediaQuery } from '@mui/material';
import { Close, ArrowBack } from '@mui/icons-material';
import Sidebar from './Sidebar';
import PeopleList from './PeopleList';
import PersonDetails from './PersonDetails';
import { useScheduling } from './SchedulingContext';
import axios from '../api/axios';

const PeopleDialog = ({ open, onClose }) => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showingDetails, setShowingDetails] = useState(false);

  const { doctors, technicians, users, tags, refreshData } = useScheduling();
  const isMobile = useMediaQuery('(max-width:800px)');

  const getCurrentPeople = () => {
    const types = ['doctors', 'technicians', 'users'];
    const peopleMap = {
      doctors,
      technicians,
      users
    };
    let people = peopleMap[types[tab]] || [];

    // Apply tag filter (OR logic)
    if (selectedTags.length > 0) {
      people = people.filter(person => {
        if (!person.tags || person.tags.length === 0) return false;
        return person.tags.some(personTag =>
          selectedTags.some(selectedTag => selectedTag.id === personTag.id)
        );
      });
    }

    return people;
  };

  const handleTabChange = (newValue) => {
    setTab(newValue);
    setSelectedTags([]);
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
  };

  const handleCancel = () => {
    if (isAdding) {
      setIsAdding(false);
      setSelectedPerson(null);
      if (isMobile) {
        setShowingDetails(false);
      }
    }
    setEditMode(false);
    if (isMobile) {
      setShowingDetails(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const types = ['doctors', 'technicians', 'users'];
      const endpoint = types[tab];
      const filteredPeople = getCurrentPeople();

      if (filteredPeople.length === 0) {
        alert('No records to export with the current filters.');
        return;
      }

      // Build query params for tag filtering
      const params = new URLSearchParams();
      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.map(tag => tag.id).join(','));
      }

      const response = await axios.get(`/${endpoint}/export/csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${endpoint}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
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
                tags={tags.filter(tag =>
                  tag.appliesTo.includes(tab === 0 ? 'doctor' : tab === 1 ? 'technician' : 'user')
                )}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                showTagFilter={true}
                onExportCSV={handleExportCSV}
                showExportButton={true}
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
              onCancel={handleCancel}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PeopleDialog;