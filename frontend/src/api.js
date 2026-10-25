import axios from 'axios';

// Dynamically resolve base API URL from Vite environment variables
const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Ensure /api suffix is present for all backend routes
const baseURL = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getRoutes = () => api.get('/routes');
export const getBuses = () => api.get('/buses');
export const getTrips = () => api.get('/trips');
export const getTripDetail = (tripId) => api.get(`/trips/${tripId}`);
export const createBooking = (data) => api.post('/bookings', data);
export const getBookings = (params) => api.get('/bookings', { params });
export const getBookingById = (bookingId) => api.get(`/bookings/${bookingId}`);
export const cancelBooking = (bookingId) => api.post(`/bookings/${bookingId}/cancel`);
export const swapTripBus = (tripId, data) => api.post(`/trips/${tripId}/swap-bus`, data);
export const cancelTrip = (tripId) => api.post(`/trips/${tripId}/cancel-trip`);
export const getAnalytics = () => api.get('/reports/analytics');
export const resetDatabase = () => api.post('/reset');

export default api;
