import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

const RecurringEventChoiceDialog = ({ open, onClose, onChoice }) => {
  
  return (
    <Dialog 
      open={open} 
      onClose={() => onClose(null)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Modify Recurring Event</DialogTitle>
      <DialogContent>
        <DialogContentText>
          How would you like to view/edit this event?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onChoice('single')} variant="outlined">
          This event only
        </Button>
        <Button onClick={() => onChoice('future')} variant="outlined">
          This and future events
        </Button>
        <Button onClick={() => onChoice('all')} variant="outlined">
          All events in series
        </Button>
        <Button onClick={() => onClose(null)} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringEventChoiceDialog;