import axios from 'axios';

const API_BASE_URL = 'https://aegis-backend-blue.vercel.app';
const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
    },
});

export default api;