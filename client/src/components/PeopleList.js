import React from 'react';
import { Box, TextField, List, ListItem, ListItemText, Button } from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';

const PeopleList = ({
  people,
  searchTerm,
  selectedPerson,
  onSearchChange,
  onPersonSelect,
  onAddNew
}) => {
  const filteredPeople = people.filter((person) =>
    person.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const isMobile = useMediaQuery('(max-width:800px)');

  return (
    <Box sx={{ width: isMobile ? '70%' : '35%', borderRight: 1, borderColor: 'divider', px: 2, display: 'flex', flexDirection: 'column' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
        }}
        sx={{ /* mb: 2, */ mt: 1 /* 2 */ }}
      />
      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {filteredPeople.map((person) => (
          <ListItem
            key={person.id}
            //button
            onClick={() => onPersonSelect(person)}
            selected={selectedPerson?.id === person.id}
            sx={{
              backgroundColor: selectedPerson?.id === person.id ? 'action.selected' : 'inherit',
              '&:hover': { backgroundColor: 'action.hover' },
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
        onClick={onAddNew}
        sx={{ mt: 2, mb: 2 }}
      >
        Add New
      </Button>
    </Box>
  );
};

export default PeopleList