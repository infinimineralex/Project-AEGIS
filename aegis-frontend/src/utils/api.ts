import axios from 'axios';

//const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const api = axios.create({
  //baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  baseURL: 'http://localhost:5000',
});

// Attach the API key to every request
/*api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers['apikey'] = SUPABASE_ANON_KEY;
  return config;
});*/

export default api;