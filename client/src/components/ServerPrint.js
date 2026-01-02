import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PrintHandler from "./PrintHandler";

export default function SchedulePdfView() {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);

  // Support both old format (technicianId) and new format (startDate/endDate)
  const technicianId = searchParams.get("technicianId");
  const start = searchParams.get("start") || searchParams.get("startDate");
  const end = searchParams.get("end") || searchParams.get("endDate");
  const view = searchParams.get("view") || "agenda";
  const customHeader = searchParams.get("header") ? decodeURIComponent(searchParams.get("header")) : '';

  // Parse display options (support both formats)
  const parseDisplayOptions = () => {
    const optsParam = searchParams.get("opts");
    if (optsParam) {
      try {
        const compactOpts = JSON.parse(decodeURIComponent(optsParam));
        return {
          showDescription: compactOpts.d !== undefined ? compactOpts.d : true,
          showLabel: compactOpts.l !== undefined ? compactOpts.l : true,
          showTechnicians: compactOpts.t !== undefined ? compactOpts.t : false,
          showOfficeNotes: compactOpts.on !== undefined ? compactOpts.on : false,
          doctorInfo: {
            showName: compactOpts.dn !== undefined ? compactOpts.dn : true,
            showAddress: compactOpts.da !== undefined ? compactOpts.da : true,
            showPhone: compactOpts.dp !== undefined ? compactOpts.dp : false,
          }
        };
      } catch (e) {
        console.error("Error parsing opts:", e);
      }
    }

    // Default display options for technician emails
    return {
      showDescription: true,
      showLabel: true,
      showTechnicians: false,
      showOfficeNotes: false,
      doctorInfo: {
        showName: true,
        showAddress: true,
        showPhone: false
      }
    };
  };

  const filterParams = {
    displayOptions: parseDisplayOptions(),
    view: view,
    customHeader: customHeader,
    splitByMonth: searchParams.get('splitByMonth') === 'true'
  };

  useEffect(() => {
    console.log('ServerPrint useEffect - start:', start, 'end:', end);
    if (!start || !end) {
      console.log('ServerPrint: Missing start or end date, returning early');
      return;
    }

    // Build query params for /events route
    const params = new URLSearchParams({
      start,
      end
    });
    console.log('ServerPrint: Building request with params:', params.toString());

    // Add filters from URL params
    if (technicianId) {
      params.append('technicians', technicianId);
    }

    const labels = searchParams.get('labels');
    if (labels) {
      params.append('labels', labels);
    }

    const doctors = searchParams.get('doctors');
    if (doctors) {
      params.append('doctors', doctors);
    }

    const technicians = searchParams.get('technicians');
    if (technicians) {
      params.append('technicians', technicians);
    }

    // Use the localhost-only /schedules/events-print route (no auth required)
    const url = `/api/schedules/events-print?${params.toString()}`;
    console.log('ServerPrint: Fetching from:', url);
    fetch(url)
      .then((res) => {
        console.log('ServerPrint: Fetch response status:', res.status);
        return res.json();
      })
      .then((data) => {
        console.log('ServerPrint: Received events:', data.length, 'events');
        console.log('ServerPrint: Event data:', data);
        setEvents(data);
      })
      .catch((err) => console.error("ServerPrint: Failed to load schedule", err));
  }, [technicianId, start, end, searchParams]);

  return (
    <div className="pdf-wrapper">
      <PrintHandler
        events={events}
        view={view}
        dateRange={{ start, end }}
        close={() => {}}
        filterParams={filterParams}
        showEditButton={false}
      />
    </div>
  );
}