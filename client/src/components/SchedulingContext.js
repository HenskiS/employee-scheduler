// SchedulingContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

const SchedulingContext = createContext();

const DEFAULT_REFRESH_INTERVAL = 30 * 1000 // 30 seconds // 2 * 60 * 1000; // 2 minutes

const throughThirty = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
  ];

export const SchedulingProvider = ({ children, refreshInterval = DEFAULT_REFRESH_INTERVAL }) => {
    const [doctors, setDoctors] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [events, setEvents] = useState([]);
    const labels = ['None', 'Available', 'Canceled', 'Holiday', 'Meeting'];
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            const [doctorsData, techniciansData, eventsData] = await Promise.all([
                axios.get('/api/doctors'),//.then(res => res.json()),
                axios.get('/api/technicians'),//.then(res => res.json()),
                axios.get('/api/events')//.then(res => res.json())
            ]);
            /*const response = await axios.get('/api/technicians');
            setTechnicians(response.data);

            const response = await axios.get('/api/events');
            setEvents(response.data);*/

            setDoctors(doctorsData.data);
            setTechnicians(techniciansData.data.sort((a, b) => a.name.localeCompare(b.name)));
            setEvents(eventsData.data);
            setError(null);
        } catch (err) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        const intervalId = setInterval(fetchData, refreshInterval);

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, [fetchData, refreshInterval]);

    const refreshData = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return (
        <SchedulingContext.Provider value={{ labels, doctors, technicians, events, throughThirty, loading, error, refreshData }}>
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