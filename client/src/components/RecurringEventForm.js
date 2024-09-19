import React, { useEffect, useState } from 'react';
import { TextField, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { datetime, RRule, RRuleSet, rrulestr } from 'rrule';

const RecurringEventForm = ({ startDate, onSave }) => {
  const [frequency, setFrequency] = useState('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [weekdays, setWeekdays] = useState([]);
  const [untilDate, setUntilDate] = useState(null);

  const handleSave = () => {
    const rruleOptions = {
      freq: RRule[frequency],
      interval: interval,
      dtstart: new Date(startDate),
      until: untilDate ? new Date(untilDate) : null
    };

    if (frequency === 'WEEKLY' && weekdays.length > 0) {
      rruleOptions.byweekday = weekdays.map(day => RRule[day]);
    }

    const rule = new RRule(rruleOptions);

    onSave(rule.toString());
  };

  useEffect(()=>{
    handleSave()
  }, [frequency, interval,weekdays,untilDate])

  return (
    <div className='recurring-form'>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0px' }}>
        <TextField
            select
            margin="dense"
            name="frequency"
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            
        >
            <MenuItem value="DAILY">Daily</MenuItem>
            <MenuItem value="WEEKLY">Weekly</MenuItem>
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="YEARLY">Yearly</MenuItem>
        </TextField>
        <TextField
            margin="dense"
            type="number"
            label="Interval"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value))}
            
            
        />
        </div>
        {frequency === 'WEEKLY' && (
          <div>
            {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day) => (
              <FormControlLabel
                key={day}
                control={
                  <Checkbox
                    checked={weekdays.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWeekdays([...weekdays, day]);
                      } else {
                        setWeekdays(weekdays.filter(d => d !== day));
                      }
                    }}
                  />
                }
                label={day}
              />
            ))}
          </div>
        )}
        <DatePicker
          label="Repeat Until"
          value={untilDate}
          onChange={(newValue) => setUntilDate(newValue)}
          renderInput={(params) => <TextField {...params} fullWidth />}
        />
    </div>
  )
};

export default RecurringEventForm;