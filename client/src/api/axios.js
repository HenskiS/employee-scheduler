import axios from 'axios';

const instance = axios.create({
  //baseURL: '/api',
  baseURL: 'http://localhost:5000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;