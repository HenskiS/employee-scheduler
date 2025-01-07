import React from 'react';
import moment from 'moment';
import Calendar from './CustomPrintCalendar';
import { useScheduling } from './SchedulingContext';
import { Button } from '@mui/material';


const PrintHandler = ({events = [], view = "month", dateRange, close, filterParams}) => {
    const { colorMap, labels } = useScheduling();

    const EventComponent = ({ event }) => {
        const backgroundColor = colorMap[event.label] || '#3174ad';
    
        const startTime = moment(event.start).format('h:mma');
        const endTime = moment(event.end).format('h:mma');
        const timeRange = `${startTime}–${endTime}`;
        const displayOptions = filterParams.displayOptions || {};
        const doctorOptions = displayOptions.doctorInfo || {};
        const doctor = event.Doctor || {};
        
        return (
            <div className="print-event-text-container">
                <div style={{color: backgroundColor}} className="print-event-text">
                    {event.allDay ? '[All Day]' : timeRange} <b>{event.title}</b>
                    {displayOptions?.showDescription && event.description && (
                        <div className="print-event-description">
                            {event.description}
                        </div>
                    )}
                    {event.Doctor && Object.values(doctorOptions).some(Boolean) && (
                        <>
                            <div className="print-event-description">{doctorOptions.showName && doctor?.name} </div>
                            <div className="print-event-description">{doctorOptions.showAddress && [
                                    doctor?.address1,
                                    doctor?.address2,
                                    doctor?.city,
                                    doctor?.zip
                                ].filter(Boolean).join(', ')}</div>
                            <div className="print-event-description">{doctorOptions.showPhone && doctor?.phone}</div>   
                        </>           
                    )}
                    {event.Technicians && displayOptions?.showTechnicians && (
                        <div className="print-event-description">
                            {event.Technicians.map(t=>t.name).join(', ')}
                        </div>
                    )}
                    {displayOptions.showLabel && event.label && event.label !== 'none' && (
                        <div className="print-event-description">
                            {labels.find(l=>l.value===event.label)?.label}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const processEvents = () => {
        return events.flatMap(event => ({
            title: event.name,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            ...event
        }));
    };

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

    const getPeriods = () => {
        if (!dateRange) {
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
            const periods = [];
            let current = moment(dateRange.start);
            const endDate = moment(dateRange.end);

            while (current.isSameOrBefore(endDate)) {
                if (view === 'month' || view === 'agenda') {
                    periods.push(current.format('YYYY-MM'));
                    const nextMonth = current.clone();
                    // Set to first day of next month
                    nextMonth.add(1, 'month').startOf('month');
                    current = nextMonth;
                } else {
                    periods.push(current.startOf('week').format('YYYY-MM-DD'));
                    current.add(1, 'week');
                }
            }

            return periods;           
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCancel = () => {
        close();
    };

    return (
        <div>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                }
            `}</style>
            <div className="print-controls no-print">
                <Button onClick={handleCancel} variant="outlined" className="print-button">
                    Cancel
                </Button>
                <Button onClick={handlePrint} variant="outlined" className="print-button">
                    Print
                </Button>
            </div>
            <div>
                {getPeriods().map(periodKey => {
                    const periodStart = view === 'week'
                        ? moment(periodKey).startOf('week').toDate()
                        : moment(periodKey).startOf('month').toDate();
                    
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
                        <div key={periodKey} className="cal-container print-cal-page">
                            <CustomToolbar 
                                date={view === 'week'
                                    ? moment(periodKey).startOf('week').toDate()
                                    : moment(periodKey).toDate()
                                } 
                                view={view}
                            />
                            <Calendar
                                date={periodStart}
                                events={periodEvents}
                                view={view}
                                components={{
                                    event: EventComponent
                                }}
                                showAllEvents
                                dateRange={dateRange}
                                filterParams={filterParams}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PrintHandler;