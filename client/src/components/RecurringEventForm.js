import React, { useEffect, useState, useCallback } from 'react';
import { TextField, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { RRule } from 'rrule';
import moment from 'moment';

const RecurringEventForm = ({ startDate, rrule, onChange }) => {
  const [formState, setFormState] = useState({
    frequency: 'WEEKLY',
    interval: 1,
    weekdays: [],
    untilDate: null
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const weekdayMap = {
    0: 'MO',
    1: 'TU',
    2: 'WE',
    3: 'TH',
    4: 'FR',
    5: 'SA',
    6: 'SU'
  };

  // Initialize form from rrule or set defaults
  useEffect(() => {
    if (isInitialLoad) {
      if (rrule) {
        try {
          const parsedRule = RRule.fromString(rrule);
          setFormState({
            frequency: RRule.FREQUENCIES[parsedRule.options.freq],
            interval: parsedRule.options.interval || 1,
            weekdays: parsedRule.options.byweekday ? 
              parsedRule.options.byweekday.map(day => weekdayMap[day]) : [],
            untilDate: parsedRule.options.until ? moment(parsedRule.options.until) : null
          });
        } catch (error) {
          console.error("Error parsing rrule:", error);
          // On error, keep default state
        }
      } else {
        // For new events, initialize based on frequency
        let initialState = { ...formState };

        // Only set weekdays for weekly frequency
        if (formState.frequency === 'WEEKLY') {
          const currentDayOfWeek = moment().format('dd').toUpperCase();
          initialState.weekdays = [currentDayOfWeek];
          setFormState(prev => ({
            ...prev,
            weekdays: [currentDayOfWeek]
          }));
        }

        // Generate initial rrule for new events
        const initialRRule = generateRRule(initialState);
        if (initialRRule) {
          onChange(initialRRule);
        }
      }
      setIsInitialLoad(false);
    }
  }, [rrule, isInitialLoad, onChange]);

  const generateRRule = useCallback((stateToUse) => {
    const rruleOptions = {
      freq: RRule[stateToUse.frequency],
      interval: parseInt(stateToUse.interval) || 1,
      dtstart: startDate ? moment(startDate).toDate() : new Date(),
    };

    if (stateToUse.untilDate && moment(stateToUse.untilDate).isValid()) {
      rruleOptions.until = moment(stateToUse.untilDate).toDate();
    }

    if (stateToUse.frequency === 'WEEKLY' && stateToUse.weekdays.length > 0) {
      rruleOptions.byweekday = stateToUse.weekdays.map(day => RRule[day]);
    }

    try {
      const rule = new RRule(rruleOptions);
      return rule.toString();
    } catch (error) {
      console.error("Error creating RRule:", error);
      return null;
    }
  }, [startDate]);

  const updateFormState = (updates) => {
    // Create the new state immediately
    let newState = {
      ...formState,
      ...updates
    };

    // Clear weekdays if frequency is not WEEKLY
    if (updates.frequency && updates.frequency !== 'WEEKLY') {
      newState.weekdays = [];
    }
    
    // Generate rrule with the new state before setting it
    if (!isInitialLoad) {
      const newRRule = generateRRule(newState);
      if (newRRule) {
        onChange(newRRule);
      }
    }
    
    // Update the form state
    setFormState(newState);
  };

  return (
    <div className='recurring-form'>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0px' }}>
        <TextField
          select
          margin="dense"
          name="frequency"
          label="Frequency"
          value={formState.frequency}
          onChange={(e) => updateFormState({ frequency: e.target.value })}
          style={{flex: 2, marginRight: '10px'}}
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
          value={formState.interval}
          onChange={(e) => updateFormState({ interval: e.target.value })}
          style={{flex: 1}}
        />
      </div>
      {formState.frequency === 'WEEKLY' && (
        <div>
          {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day) => (
            <FormControlLabel
              key={day}
              control={
                <Checkbox
                  checked={formState.weekdays.includes(day)}
                  onChange={(e) => {
                    const newWeekdays = e.target.checked
                      ? [...formState.weekdays, day]
                      : formState.weekdays.filter(d => d !== day);
                    updateFormState({ weekdays: newWeekdays });
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
        value={formState.untilDate}
        onChange={(newValue) => updateFormState({ untilDate: newValue })}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
    </div>
  );
};

export default RecurringEventForm;