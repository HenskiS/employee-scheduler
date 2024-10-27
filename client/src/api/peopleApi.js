import axios from '../api/axios';

export const fetchPeople = async () => {
  try {
    const [doctors, technicians, users] = await Promise.all([
      axios.get('/api/doctors'),
      axios.get('/api/technicians'),
      axios.get('/api/users')
    ]);

    return {
      doctors: doctors.data,
      technicians: technicians.data,
      users: users.data
    };
  } catch (error) {
    console.error('Error fetching people:', error);
    throw error;
  }
};