import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControlLabel, 
  Checkbox 
} from '@mui/material';

const EmailOptionsForm = ({ 
  emailSubject, 
  setEmailSubject, 
  emailMessage, 
  setEmailMessage, 
  includeAllEvents, 
  setIncludeAllEvents 
}) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Email Options</Typography>
      
      <TextField
        fullWidth
        label="Email Subject"
        value={emailSubject}
        onChange={(e) => setEmailSubject(e.target.value)}
        margin="normal"
        variant="outlined"
      />
      
      <TextField
        fullWidth
        label="Email Message"
        value={emailMessage}
        onChange={(e) => setEmailMessage(e.target.value)}
        margin="normal"
        variant="outlined"
        multiline
        rows={3}
      />
      
      {includeAllEvents !== undefined && setIncludeAllEvents !== undefined && (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeAllEvents}
                onChange={() => setIncludeAllEvents(!includeAllEvents)}
              />
            }
            label="Include events for All"
          />
        </Box>
      )}
    </Box>
  );
};

export default EmailOptionsForm;