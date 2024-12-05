
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../CalendarStyles.css';

const localizer = momentLocalizer(moment);

// give me another way to say events and view so I don't repeat these variable names
const PrintCalendar = ({eventsList, viewMode}) => {
    const events = eventsList ?? []
    const view = viewMode ?? "month"
    
    return (
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500, marginTop: "30px" }}
            defaultView={view} // "month" "week" or "agenda"
            toolbar={false}
        />
    )
}

export default PrintCalendar;