
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../CalendarStyles.css';

const localizer = momentLocalizer(moment);

const PrintCalendar = ({eventsList, viewMode}) => {
    const events = eventsList ?? []
    const view = viewMode ?? "month"
    const CustomToolbar = () => {
        const monthToShow = events.length > 0 
            ? moment(events[0].start).format('MMMM YYYY')
            : moment().format('MMMM YYYY');
            
        return (
            <div className="print-cal-month">
                {monthToShow}
            </div>
        );
    };

    return (
        <>
        <CustomToolbar />
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500, marginTop: "10px" }}
            defaultView={view} // "month" "week" or "agenda"
            toolbar={false}
        />
        </>
    )
}

export default PrintCalendar;