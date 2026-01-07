import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// The Interceptor that fixes the 401 error
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    // CHECK THIS: Does your login response use 'token' or 'accessToken'?
    // Print user to console to check: console.log(user);
    if (user && user.accessToken) { 
      config.headers['Authorization'] = 'Bearer ' + user.accessToken;
    } else if (user && user.token) {
        config.headers['Authorization'] = 'Bearer ' + user.token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;