// I want this to fetch all events in a given month. If updateDateRange is called, it should check if that date is in the month already fetched, and if not, fetch that month.
// SchedulingContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import moment from 'moment';

const SchedulingContext = createContext();

const DEFAULT_REFRESH_INTERVAL = 30 * 1000 // 30 seconds

const throughThirty = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
  ];
const labels = [
    { label: 'None', value: 'none', color: 'rgba(145,180,232,255)' },
    { label: 'Available', value: 'available', color: 'rgba(255,149,0,255)' },
    { label: 'Cancelled', value: 'cancelled', color: 'rgba(195,0,209,255)' },
    { label: 'Cancelled WITHOUT 24-hour notice', value: 'cancelled-no-notice', color: 'rgba(125,0,171,255)' },
    { label: 'Holiday', value: 'holiday', color: 'rgba(64,237,205,255)' },
    { label: 'Inactive', value: 'inactive', color: 'rgba(0,115,13,255)' },
    { label: 'Managers', value: 'managers', color: 'rgba(74,74,247,255)' },
    { label: 'Meeting', value: 'meeting', color: 'rgba(239,78,125,255)' },
    { label: 'Not Available', value: 'unavailable', color: 'rgba(163,240,169,255)' },
    { label: 'Prospect', value: 'prospect', color: 'rgba(0,255,217,255)' },
    { label: 'Scheduled Day Of', value: 'same-day', color: 'rgba(242,63,63,255)' },
    { label: 'T.O.R.', value: 'tor', color: 'rgba(0,199,0,255)' },
    { label: 'Trainee', value: 'trainee', color: 'rgba(247,241,54,255)' },
    { label: 'Waitlist', value: 'waitlist', color: 'rgba(194,0,0,255)' }
];
const colorMap = {
    none: 'rgba(145,180,232,255)',
    available: 'rgba(255,149,0,255)',
    cancelled: 'rgba(195,0,209,255)',
    'cancelled-no-notice': 'rgba(125,0,171,255)',
    holiday: 'rgba(64,237,205,255)',
    inactive: 'rgba(0,115,13,255)',
    managers: 'rgba(74,74,247,255)',
    meeting: 'rgba(239,78,125,255)',
    unavailable: 'rgba(163,240,169,255)',
    prospect: 'rgba(0,255,217,255)',
    'same-day': 'rgba(242,63,63,255)',
    tor: 'rgba(0,199,0,255)',
    trainee: 'rgba(247,241,54,255)',
    waitlist: 'rgba(194,0,0,255)'
};

export const SchedulingProvider = ({ children, refreshInterval = DEFAULT_REFRESH_INTERVAL }) => {
    const [doctors, setDoctors] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [events, setEvents] = useState([]);
    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').toISOString(),
        end: moment().endOf('month').toISOString()
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        // console.log(`Date range: ${JSON.stringify(dateRange)}`)
        try {
            setLoading(true);
            
            const [doctorsData, techniciansData, eventsData] = await Promise.all([
                axios.get('/api/doctors'),
                axios.get('/api/technicians'),
                axios.get(`/api/events/?start=${dateRange.start}&end=${dateRange.end}`)
            ]);

            setDoctors(doctorsData.data);
            setTechnicians(techniciansData.data.sort((a, b) => a.name.localeCompare(b.name)));
            setEvents(eventsData.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();

        const intervalId = setInterval(fetchData, refreshInterval);

        return () => clearInterval(intervalId);
    }, [fetchData, refreshInterval]);

    const refreshData = useCallback(() => {
        fetchData();
    }, [fetchData]);

    const updateDateRange = useCallback((start, end) => {
        const newStart = moment(start).startOf('day');
        const newEnd = moment(end).endOf('day');
        if (newStart.isBefore(dateRange.start) || newEnd.isAfter(dateRange.end)) {
            const newMonth = newStart.clone().startOf('month');
            /*setDateRange({
                start: newMonth.clone().startOf('month').toISOString(),
                end: newMonth.clone().endOf('month').toISOString()
            });*/
            setDateRange({start, end})
        }   
    }, [dateRange]);

    return (
        <SchedulingContext.Provider value={{ 
            labels,
            colorMap,
            doctors, 
            technicians, 
            events, 
            throughThirty, 
            loading, 
            error, 
            refreshData,
            updateDateRange
        }}>
            {children}
        </SchedulingContext.Provider>
    );
};

export const useScheduling = () => {
    const context = useContext(SchedulingContext);
    if (!context) {
        throw new Error('useScheduling must be used within a SchedulingProvider');
    }
    return context;
};