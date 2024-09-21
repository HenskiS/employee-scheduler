import React, { useEffect, useState } from 'react';
import { TextField, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { RRule } from 'rrule';
import moment from 'moment';

const RecurringEventForm = ({ startDate, rrule, onSave }) => {
  const [frequency, setFrequency] = useState('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [weekdays, setWeekdays] = useState([]);
  const [untilDate, setUntilDate] = useState(null);

  const weekdayMap = {
    0: 'MO',
    1: 'TU',
    2: 'WE',
    3: 'TH',
    4: 'FR',
    5: 'SA',
    6: 'SU'
  };

  useEffect(() => {
    if (rrule) {
      try {
        const parsedRule = RRule.fromString(rrule);
        setFrequency(RRule.FREQUENCIES[parsedRule.options.freq]);
        setInterval(parsedRule.options.interval || 1);
        if (parsedRule.options.byweekday) {
          setWeekdays(parsedRule.options.byweekday.map(day => weekdayMap[day.weekday]));
        }
        setUntilDate(parsedRule.options.until ? moment(parsedRule.options.until) : null);
      } catch (error) {
        console.error("Error parsing rrule:", error);
      }
    }
  }, [rrule]);

  const handleSave = () => {

    const rruleOptions = {
      freq: RRule[frequency],
      interval: parseInt(interval) || 1,
      dtstart: startDate ? moment(startDate).toDate() : new Date(),
    };

    if (untilDate && moment(untilDate).isValid()) {
      rruleOptions.until = moment(untilDate).toDate();
    }

    if (frequency === 'WEEKLY' && weekdays.length > 0) {
      rruleOptions.byweekday = weekdays.map(day => {
        return RRule[day];
      });
    }

    try {
      const rule = new RRule(rruleOptions);
      const ruleString = rule.toString();
      console.log("Generated rrule string:", ruleString);
      onSave(ruleString);
    } catch (error) {
      console.error("Error creating RRule:", error);
      console.log("RRule options causing error:", JSON.stringify(rruleOptions, null, 2));
    }
  };

  useEffect(() => {
    handleSave();
  }, [frequency, interval, weekdays, untilDate]);

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
          onChange={(e) => setInterval(e.target.value)}
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
  );
};

export default RecurringEventForm;