import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../PrintCalendarStyles.css';
import { useScheduling } from './SchedulingContext';
import { useEffect } from 'react';
import { Button } from '@mui/material';

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

const AgendaEventComponent = ({ event }) => {
    const { colorMap } = useScheduling()
    const backgroundColor = colorMap[event.label] || '#3174ad'
    
    const style = {
        backgroundColor: backgroundColor + '20',
        borderLeft: `4px solid ${backgroundColor}`,
        padding: '0 4px',
        margin: '2px 0'
    };
    
    return (
        <div style={style}>
            {event.title}
        </div>
    );
};

const PrintCalendar = ({eventsList, viewMode, dateRange, close}) => {
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

    const CustomToolbar = ({ date, view }) => {
        if (view === 'month') {
            return (
                <div className="print-cal-month">
                    {moment(date).format('MMMM YYYY')}
                </div>
            );
        } else if (view === 'week') {
            return (
                <div className="print-cal-week">
                    {`Week of ${moment(date).startOf('week').format('MMMM D, YYYY')}`}
                </div>
            );
        } else {
            return (
                <div className="print-cal-agenda">
                    {`Events: ${moment(dateRange.start).format('MMMM D, YYYY')} - ${moment(dateRange.end).format('MMMM D, YYYY')}`}
                </div>
            );
        }
    };

    // Get periods (months or weeks) based on dateRange or events
    const getPeriods = () => {
        if (!dateRange) {
            // If no dateRange provided, get periods from events
            const processedEvents = processEvents();
            if (view === 'month' || view === 'agenda') {
                const months = processedEvents.map(event => moment(event.start).format('YYYY-MM'));
                return [...new Set(months)].sort();
            } else {
                const weeks = processedEvents.map(event => 
                    moment(event.start).startOf('week').format('YYYY-MM-DD')
                );
                return [...new Set(weeks)].sort();
            }
        } else {
            // Generate periods based on dateRange
            const { start, end } = dateRange;
            const periods = [];
            let current = moment(start);
            const endDate = moment(end);

            while (current.isSameOrBefore(endDate)) {
                if (view === 'month' || view === 'agenda') {
                    periods.push(current.format('YYYY-MM'));
                    current.add(1, 'month');
                } else {
                    periods.push(current.startOf('week').format('YYYY-MM-DD'));
                    current.add(1, 'week');
                }
            }
            return periods;
        }
    };

    const periods = getPeriods();

    // Custom time slots for weekly view
    const getTimeSlotProps = () => {
        if (view === 'week') {
            return {
                step: 60,
                timeslots: 1,
                min: moment().startOf('day').add(8, 'hours').toDate(),
                max: moment().startOf('day').add(18, 'hours').toDate(),
            }
        }
        return {}
    }

    const handlePrint = () => {
        window.print()
    };
    const handleCancel = () => {
        close()
    };
    const printStyles = `
        @media print {
        .no-print { display: none !important; }
        .rbc-event { break-inside: avoid; }
        }
    `;

    return (
        
        <div><style>{printStyles}</style>
            <div style={{display: 'flex', justifyContent: 'center', margin: '10px 0', padding: '5px'}}>
                <Button onClick={handleCancel} className="no-print" variant='outlined' style={{margin: '0 4px'}}>
                    Cancel
                </Button>
                <Button onClick={handlePrint} className="no-print" variant='outlined' style={{margin: '0 4px'}}>
                    Print
                </Button>
            </div>
            <div>
                {periods.map(periodKey => {
                    const periodStart = view === 'week'
                        ? moment(periodKey).startOf('week').toDate()
                        : moment(periodKey).startOf('month').toDate();
                    
                    const periodEnd = view === 'week'
                        ? moment(periodKey).endOf('week').toDate()
                        : moment(periodKey).endOf('month').toDate();
                    
                    const periodEvents = processEvents().filter(event => {
                        if (view === 'week') {
                            const eventStart = moment(event.start);
                            const weekStart = moment(periodKey);
                            return eventStart.isSameOrAfter(weekStart, 'day') && 
                                   eventStart.isBefore(weekStart.clone().add(1, 'week'), 'day');
                        } else {
                            return moment(event.start).format('YYYY-MM') === periodKey;
                        }
                    });
    
                    return (
                        <div 
                            key={periodKey} 
                            className="cal-container print-cal-page"
                        >
                            <CustomToolbar 
                                date={view === 'week'
                                    ? moment(periodKey).startOf('week').toDate()
                                    : moment(periodKey).toDate()
                                } 
                                view={view}
                            />
                            <Calendar
                                localizer={localizer}
                                events={periodEvents}
                                components={{
                                    event: view === 'agenda' ? AgendaEventComponent : EventComponent
                                }}
                                startAccessor="start"
                                endAccessor="end"
                                defaultView={view}
                                defaultDate={periodStart}
                                toolbar={false}
                                showAllEvents
                                {...getTimeSlotProps()}
                                length={30}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PrintCalendar;