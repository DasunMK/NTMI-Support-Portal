import api from "../api/axiosConfig"; 

const TICKET_URL = "/api/v1/tickets"; 
const NOTIFICATION_URL = "/api/v1/notifications"; 

const createTicket = (ticketData) => {
  return api.post(TICKET_URL, ticketData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const getAllTickets = () => { return api.get(TICKET_URL); };

const updateTicketStatus = (ticketId, status, adminUsername) => {
  return api.put(`${TICKET_URL}/${ticketId}/status`, { 
    status, username: adminUsername 
  });
};

const getNotifications = (username) => {
    return api.get(`${NOTIFICATION_URL}/${username}`);
};

const markAsRead = (id) => {
    return api.put(`${NOTIFICATION_URL}/${id}/read`);
};

const TicketService = {
  createTicket, getAllTickets, updateTicketStatus,
  getNotifications, markAsRead
};

export default TicketService;