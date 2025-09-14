import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import moment from 'moment';

const SchedulingContext = createContext();

const DEFAULT_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

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
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').toISOString(),
        end: moment().endOf('month').toISOString()
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Watch for token changes
    useEffect(() => {
        const handleStorageChange = () => {
            const newToken = localStorage.getItem('token');
            setToken(newToken);
        };

        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange);
        
        // Also set up an interval to check localStorage directly
        // This handles same-window token changes
        const tokenCheckInterval = setInterval(() => {
            const currentToken = localStorage.getItem('token');
            if (currentToken !== token) {
                setToken(currentToken);
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(tokenCheckInterval);
        };
    }, [token]);

    const fetchData = useCallback(async () => {
        if (!token) return;
        
        try {
            setLoading(true);
            
            const response = await axios.get(`/refresh?start=${dateRange.start}&end=${dateRange.end}`);
            const { data: { doctors, technicians, users, events } } = response.data;

            setDoctors(doctors.sort((a, b) => a.customer.localeCompare(b.customer)));
            setTechnicians(technicians.sort((a, b) => a.name.localeCompare(b.name)));
            setUsers(users.sort((a, b) => a.name.localeCompare(b.name)));
            setEvents(events);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateRange, token]);

    // Fetch data whenever token changes
    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, fetchData]);

    // Set up refresh interval when we have a token
    useEffect(() => {
        if (!token) return;

        const intervalId = setInterval(fetchData, refreshInterval);
        return () => clearInterval(intervalId);
    }, [fetchData, refreshInterval, token]);

    const refreshData = useCallback(() => {
        if (token) {
            fetchData();
        }
    }, [fetchData, token]);

    const fetchFilteredEvents = useCallback(async (start, end, filters = {}) => {
        if (!token) return [];

        try {
            const params = new URLSearchParams({
                start,
                end
            });

            if (filters.labels?.length > 0) {
                const labelValues = filters.labels.map(label =>
                    typeof label === 'string' ? label : label.value
                ).join(',');
                params.append('labels', labelValues);
            }

            if (filters.doctors?.length > 0) {
                const doctorIds = filters.doctors.map(doctor => doctor.id).join(',');
                params.append('doctors', doctorIds);
            }

            if (filters.technicians?.length > 0) {
                const technicianIds = filters.technicians.map(technician => technician.id).join(',');
                params.append('technicians', technicianIds);
            }

            const response = await axios.get(`/events?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching filtered events:', error);
            throw error;
        }
    }, [token]);

    const updateDateRange = useCallback((start, end) => {
        if (!token) return;
        
        const newStart = moment(start).startOf('day');
        const newEnd = moment(end).endOf('day');

        let expandedStart = moment(newStart.isBefore(dateRange.start) ? newStart : dateRange.start);
        let expandedEnd = moment(newEnd.isAfter(dateRange.end) ? newEnd : dateRange.end);
        const sixMonthsInDays = 180;
        const daysDiff = expandedEnd.diff(expandedStart, 'days');     
        // Don't allow a date range greater than 6 months
        if (daysDiff > sixMonthsInDays) {
            if (newStart.isBefore(dateRange.start)) {
                expandedEnd = moment.min(expandedEnd, newStart.clone().add(sixMonthsInDays, 'days'));
            }
            if (newEnd.isAfter(dateRange.end)) {
                expandedStart = moment.max(expandedStart, newEnd.clone().subtract(sixMonthsInDays, 'days'));
            }
        }
        
        if (!expandedStart.isSame(dateRange.start) || !expandedEnd.isSame(dateRange.end)) {
            setDateRange({
                start: expandedStart.toISOString(),
                end: expandedEnd.toISOString()
            });
            console.log(`Expanded date range: ${expandedStart.format('YYYY-MM-DD')} to ${expandedEnd.format('YYYY-MM-DD')}`);
        }
    }, [dateRange, token]);

    return (
        <SchedulingContext.Provider value={{
            labels,
            colorMap,
            doctors,
            technicians,
            users,
            events,
            throughThirty,
            loading,
            error,
            refreshData,
            updateDateRange,
            fetchFilteredEvents
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