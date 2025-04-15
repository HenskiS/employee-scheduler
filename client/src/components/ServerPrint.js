import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AgendaComponent from "../components/AgendaView"; // your existing component

export default function SchedulePdfView() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const technicianId = searchParams.get("technicianId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const all = searchParams.get("all");
  const filterParams = {
    displayOptions: {
      showDescription: true,
      showLabel: true,
      showTechnicians: false,
      doctorInfo: {
        showName: true,
        showAddress: true,
        showPhone: false
      }
    }
  };
  const processEvents = (events) => {
    if (!events.length) return [];
    return events.flatMap(event => ({
        title: event.name,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        ...event
    }));
};

  useEffect(() => {
    if (!technicianId || !start || !end) return;

    fetch(
      `/api/schedules/events?technicianId=${technicianId}&start=${start}&end=${end}&all=${all}`
    )
      .then((res) => res.json())
      .then((data) => {setEvents(data);console.log(data);})
      .catch((err) => console.error("Failed to load schedule", err));
  }, [technicianId, start, end, all]);

  return (
    <div className="pdf-wrapper custom-calendar">
      <h2>Schedule {start} to {end}</h2>
      {events.length? 
        <AgendaComponent events={processEvents(events)} filterParams={filterParams} onSelectEvent={()=> {return null}} />
        :
        <p>No events in this period...</p>
      }
    </div>
  );
}