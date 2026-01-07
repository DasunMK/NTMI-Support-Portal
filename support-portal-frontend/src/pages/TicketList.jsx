import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, Box 
} from '@mui/material';
import api from '../api/axiosConfig';
import ChatWindow from '../components/ChatWindow'; // <--- Import ChatWindow

export default function TicketList() {
  // --- 1. HOOKS MUST BE HERE (INSIDE THE FUNCTION) ---
  const [tickets, setTickets] = useState([]);
  const [activeChatTicket, setActiveChatTicket] = useState(null); // <--- State for Chat

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      // Assuming this endpoint returns tickets for the logged-in branch user
      const response = await api.get('/tickets'); 
      // If your API returns ALL tickets, you might need to filter them here 
      // or ensure the backend filters by 'currentUser'
      setTickets(response.data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'error';
      case 'IN_PROGRESS': return 'warning';
      case 'RESOLVED': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        My Ticket History
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Ticket No</strong></TableCell>
              <TableCell><strong>Issue</strong></TableCell>
              <TableCell><strong>Priority</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Assigned Admin</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} hover>
                <TableCell>{ticket.ticketNumber}</TableCell>
                <TableCell>{ticket.description}</TableCell>
                <TableCell>
                  <Chip 
                    label={ticket.priority} 
                    color={ticket.priority === 'HIGH' ? 'error' : ticket.priority === 'MEDIUM' ? 'warning' : 'success'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" />
                </TableCell>
                <TableCell>
                    {ticket.assignedTo ? ticket.assignedTo.fullName : "Pending..."}
                </TableCell>
                
                <TableCell align="center">
                    {/* CHAT BUTTON - Only visible if Admin has started the job */}
                    {ticket.status === 'IN_PROGRESS' ? (
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          size="small"
                          onClick={() => setActiveChatTicket(ticket.id)}
                        >
                          Chat with Admin
                        </Button>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            {ticket.status === 'OPEN' ? 'Waiting for Admin' : 'Closed'}
                        </Typography>
                    )}
                </TableCell>
              </TableRow>
            ))}
            {tickets.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} align="center">No tickets found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- CHAT WINDOW COMPONENT --- */}
      {activeChatTicket && (
        <ChatWindow 
          ticketId={activeChatTicket} 
          onClose={() => setActiveChatTicket(null)} 
        />
      )}

    </Container>
  );
}