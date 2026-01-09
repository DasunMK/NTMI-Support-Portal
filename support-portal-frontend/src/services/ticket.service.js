import axios from 'axios';
import AuthService from './auth.service';

const API_URL = 'http://localhost:8080/api/v1/tickets';
const NOTIFICATION_URL = 'http://localhost:8080/api/v1/notifications'; // New URL

const getAllTickets = () => {
  return axios.get(API_URL, { headers: AuthService.authHeader() });
};

const getTicketById = (id) => {
  return axios.get(API_URL + '/' + id, { headers: AuthService.authHeader() });
};

const createTicket = (ticketData) => {
  const headers = AuthService.authHeader();
  // Allow FormData for images
  if (!(ticketData instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
  }
  return axios.post(API_URL, ticketData, { headers });
};

const updateTicketStatus = (id, status, assignedTo) => {
  return axios.put(
    `${API_URL}/${id}/status`,
    null,
    {
      params: { status, assignedTo },
      headers: AuthService.authHeader()
    }
  );
};

// --- ADD THIS MISSING FUNCTION ---
const getNotifications = (username) => {
  return axios.get(`${NOTIFICATION_URL}/${username}`, { 
    headers: AuthService.authHeader() 
  });
};

const markNotificationRead = (id) => {
  return axios.put(`${NOTIFICATION_URL}/${id}/read`, {}, { 
      headers: AuthService.authHeader() 
  });
};

const TicketService = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  getNotifications,     // <--- Ensure this is exported
  markNotificationRead
};

export default TicketService;