import React from 'react';
import { Box, TextField, List, ListItem, ListItemText, Button, Autocomplete, Chip, IconButton, Tooltip } from '@mui/material';
import { Search, Add, FileDownload } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';

const PeopleList = ({
  people,
  searchTerm,
  selectedPerson,
  onSearchChange,
  onPersonSelect,
  onAddNew,
  tags,
  selectedTags,
  onTagsChange,
  showTagFilter,
  onExportCSV,
  showExportButton
}) => {
  const getDisplayName = (person) => {
    if (person.customer) {
      return person.customer;
    }
    else if (person.practiceName) {
      return person.practiceName;
    }
    else if (person.name) {
      return person.name;
    }
    return 'Unnamed';
  };

  const filteredPeople = people.filter((person) => {
    const displayName = getDisplayName(person);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const isMobile = useMediaQuery('(max-width:800px)');

  return (
    <Box sx={{ width: isMobile ? '70%' : '35%', borderRight: 1, borderColor: 'divider', px: 2, display: 'flex', flexDirection: 'column' }}>
      {/* Search and Export Row */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
          }}
        />
        {showExportButton && (
          <Tooltip title="Export to CSV">
            <IconButton
              onClick={onExportCSV}
              color="primary"
              sx={{ border: 1, borderColor: 'primary.main', borderRadius: 1 }}
            >
              <FileDownload />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Tag Filter */}
      {showTagFilter && tags && (
        <Autocomplete
          multiple
          options={tags}
          getOptionLabel={(option) => option.name}
          value={selectedTags}
          onChange={(event, newValue) => onTagsChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedTags.length === 0 ? "Filter by tags..." : ""}
              size="small"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                key={option.id}
                label={option.name}
                size="small"
                {...getTagProps({ index })}
                style={{
                  backgroundColor: option.color,
                  color: '#fff',
                  fontWeight: 500
                }}
              />
            ))
          }
          sx={{ mt: 1, mb: 1 }}
        />
      )}

      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {filteredPeople.map((person) => (
          <ListItem
            key={person.id}
            onClick={() => onPersonSelect(person)}
            selected={selectedPerson?.id === person.id}
            sx={{
              backgroundColor: selectedPerson?.id === person.id ? 'action.selected' : 'inherit',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <ListItemText
              primary={getDisplayName(person)}
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

export default PeopleList;