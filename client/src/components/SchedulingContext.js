// SchedulingContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

const SchedulingContext = createContext();

const DEFAULT_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

export const SchedulingProvider = ({ children, refreshInterval = DEFAULT_REFRESH_INTERVAL }) => {
    const [doctors, setDoctors] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            /*const [doctorsData, techniciansData, eventsData] = await Promise.all([
                fetch('/api/doctors').then(res => res.json()),
                fetch('/api/technicians').then(res => res.json()),
                fetch('/api/events').then(res => res.json())
            ]);*/

            const response = await axios.get('/api/technicians');
            setTechnicians(response.data);

            //setDoctors(doctorsData);
            //setTechnicians(techniciansData);
            //setEvents(eventsData);
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
        <SchedulingContext.Provider value={{ doctors, technicians, events, loading, error, refreshData }}>
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