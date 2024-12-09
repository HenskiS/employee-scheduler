import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment, { months } from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../CalendarStyles.css';
import {sampleEvents} from './sampleEvents'
import { useScheduling } from './SchedulingContext';

const localizer = momentLocalizer(moment);

const EventComponent = ({ event }) => {
    const backgroundColor = '#6b7280'
    
    const style = {
      backgroundColor,
      color: 'black',
      padding: '4px 8px',
      borderRadius: '4px',
      overflow: 'hidden',
      fontSize: '14px',
      height: '100%',
      position: 'relative'
    };
  
    const timeStyle = {
      fontSize: '12px',
      marginBottom: '0px'
    };
  
    const titleStyle = {
      fontWeight: 'bold'
    };
  
    const startTime = moment(event.start).format('h:mm A');
    const endTime = moment(event.end).format('h:mm A');
    
    return (
      <div style={style}>
        <div style={timeStyle}>{`${startTime} – ${endTime}`}</div>
        <div style={titleStyle}>{event.title}</div>
      </div>
    );
};

const PrintCalendar = ({eventsList, viewMode}) => {
    
    const events = eventsList || sampleEvents;
    const view = viewMode || "month";

    const processEvents = () => {
        return events.flatMap(event => {
            return [{
                title: event.name,
                start: new Date(event.startTime),
                end: new Date(event.endTime),
                allDay: event.allDay,
            }]
        })
    }

    const CustomToolbar = ({ date }) => (
        <div className="print-cal-month">
            {moment(date).format('MMMM YYYY')}
        </div>
    );

    const monthKey = moment().format('YYYY-MM')

    return (
        <div >
            <div key={monthKey} className="cal-container">
                <CustomToolbar date={moment(monthKey).toDate()} />
                <Calendar
                    localizer={localizer}
                    events={processEvents()}
                    components={{
                        event: EventComponent
                    }}
                    startAccessor={"start"}
                    endAccessor={"end"}
                    defaultView={view}
                    toolbar={false}
                />
            </div>
        </div>
    );
};

export default PrintCalendar;