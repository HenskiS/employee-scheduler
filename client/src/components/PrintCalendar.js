// Modify this component so that it displays a separate calendars for each month of events.
// Currently, only one month can be displayed
// I'll help modify the component to display multiple months. Here's the updated version:

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../PrintCalendarStyles.css';
import { useScheduling } from './SchedulingContext';
import { useEffect } from 'react';

const localizer = momentLocalizer(moment);

const EventComponent = ({ event }) => {
    const { colorMap } = useScheduling()
    const backgroundColor = colorMap[event.label] || '#3174ad'
    
    const style = {
      backgroundColor,
      color: 'black',
      padding: '2px',
      borderRadius: '4px',
      overflow: 'hidden',
      fontSize: '14px',
      height: '100%',
      position: 'relative'
    };
  
    const timeStyle = {
      fontSize: '14px',
      marginBottom: '0px'
    };
  
    const startTime = moment(event.start).format('h:mma');
    const endTime = moment(event.end).format('h:mma');
    
    return (
      <div style={style}>
        <div style={timeStyle}>
            <b style={{paddingRight: "5px"}}>{event.title}</b>
            {`${startTime}–${endTime}`}
        </div>
      </div>
    );
};

const PrintCalendar = ({eventsList, viewMode}) => {
    const {events:sampleEvents2, updateDateRange} = useScheduling()
    
    const events = eventsList || sampleEvents2;
    const view = viewMode || "month";

    const processEvents = () => {
        return events.flatMap(event => {
            return [{
                title: event.name,
                start: new Date(event.startTime),
                end: new Date(event.endTime),
                allDay: event.allDay,
                label: event.label
            }]
        })
    }

    useEffect(()=>{
        const start = moment('2024-10-01').startOf('month').toISOString()
        const end = moment('2024-12-31').endOf('month').toISOString()
        updateDateRange(start, end)
    }, [])

    const CustomToolbar = ({ date }) => (
        <div className="print-cal-month">
            {moment(date).format('MMMM YYYY')}
        </div>
    );

    // Get unique months from events
    const getUniqueMonths = () => {
        const processedEvents = processEvents();
        const months = processedEvents.map(event => moment(event.start).format('YYYY-MM'));
        return [...new Set(months)].sort();
    };

    const uniqueMonths = getUniqueMonths();

    return (
        <div>
            {uniqueMonths.map(monthKey => {
                const monthStart = moment(monthKey).startOf('month').toDate();
                const monthEnd = moment(monthKey).endOf('month').toDate();
                
                const monthEvents = processEvents().filter(event => 
                    moment(event.start).format('YYYY-MM') === monthKey
                );

                return (
                    <div key={monthKey} className="cal-container print-cal-page">
                        <CustomToolbar date={moment(monthKey).toDate()} />
                        <Calendar
                            localizer={localizer}
                            events={monthEvents}
                            components={{
                                event: EventComponent
                            }}
                            startAccessor="start"
                            endAccessor="end"
                            defaultView={view}
                            defaultDate={monthStart}
                            toolbar={false}
                            showAllEvents
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default PrintCalendar;

// The main changes include:
// 1. Added a getUniqueMonths function to extract unique months from events
// 2. Using map to create a calendar for each unique month
// 3. Filtering events for each month's calendar
// 4. Setting the specific date for each calendar to show the correct month
// 
// You might want to add some CSS to space out the calendars:
// .cal-container {
//     margin-bottom: 2rem;
// }