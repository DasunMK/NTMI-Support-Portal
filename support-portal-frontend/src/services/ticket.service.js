import api from "../api/axiosConfig"; // Import the helper we created

// Relative path (Base URL is already in axiosConfig)
const TICKET_URL = "/api/v1/tickets"; 

const createTicket = (ticketData) => {
  // We explicitly set multipart/form-data for file uploads
  return api.post(TICKET_URL, ticketData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const getAllTickets = () => {
  return api.get(TICKET_URL);
};

// Added this because your Admin Dashboard needs it
const updateTicketStatus = (ticketId, status, adminUsername) => {
  return api.put(`${TICKET_URL}/${ticketId}/status`, {
    status: status,
    username: adminUsername // Optional, if your backend needs to know WHO clicked it
  });
};

const getTicketsByBranch = (branchName) => {
    return api.get(`${TICKET_URL}/branch/${branchName}`);
};

const TicketService = {
  createTicket,
  getAllTickets,
  updateTicketStatus,
  getTicketsByBranch
};

export default TicketService;