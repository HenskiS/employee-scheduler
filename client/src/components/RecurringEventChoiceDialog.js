import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Button
} from '@mui/material';

const styles = {
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    marginTop: '16px'
  },
  choiceButton: {
    justifyContent: 'flex-start',
    textTransform: 'none',
    padding: '6px 8px',
    justifyItems: 'flex-start'
  },
  warningText: {
    color: '#d32f2f',
    fontSize: '0.875rem',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '24px'
  }
};

const RecurringEventChoiceDialog = ({ open, onClose, onChoice, mode = 'edit' }) => {
  const [selectedChoice, setSelectedChoice] = useState('single');

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedChoice('single');
    }
  }, [open]);

  const handleNext = () => {
    if (selectedChoice) {
      onChoice(selectedChoice);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => onClose(null)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        {mode === 'edit' ? 'Modify Recurring Event' : 'Delete Recurring Event'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText style={{ marginBottom: '16px' }}>
          {mode === 'edit' 
            ? 'How would you like to edit this event?' 
            : 'Which events would you like to delete?'}
        </DialogContentText>
        
        <div style={styles.buttonContainer}>
          <Button 
            onClick={() => setSelectedChoice('single')} 
            variant={selectedChoice === 'single' ? "contained" : "outlined"}
            fullWidth
            style={styles.choiceButton}
          >
            This event only
          </Button>
          
          <Button 
            onClick={() => setSelectedChoice('future')} 
            variant={selectedChoice === 'future' ? "contained" : "outlined"}
            fullWidth
            style={styles.choiceButton}
          >
            This and future events
          </Button>
          
          {mode === 'delete' && (
            <Button 
              onClick={() => setSelectedChoice('all')} 
              variant={selectedChoice === 'all' ? "contained" : "outlined"}
              fullWidth
              style={styles.choiceButton}
            >
              <div>
                <div>All events in series</div>
                <div style={styles.warningText}>(not recommended, may delete past events)</div>
              </div>
            </Button>
          )}
        </div>

        <div style={styles.actionButtons}>
          <Button 
            onClick={() => onClose(null)} 
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={!selectedChoice}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringEventChoiceDialog;