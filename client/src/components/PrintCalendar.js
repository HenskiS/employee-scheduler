import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment, { months } from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../PrintCalendarStyles.css';
import {sampleEvents} from './sampleEvents'
import { useScheduling } from './SchedulingContext';

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
  
    const titleStyle = {
      fontWeight: 'bold'
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
    const {events:sampleEvents2} = useScheduling()
    
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

    const CustomToolbar = ({ date }) => (
        <div className="print-cal-month">
            {moment(date).format('MMMM YYYY')}
        </div>
    );

    const monthKey = moment().format('YYYY-MM')

    return (
        <div>
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
                    toolbar={true}
                    showAllEvents
                />
            </div>
        </div>
    );
};

export default PrintCalendar;