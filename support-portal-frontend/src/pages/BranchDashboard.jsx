import React, { useEffect, useState } from 'react';
import { 
  Container, Card, CardContent, Typography, Chip, Box, 
  Button, Divider, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton, Paper 
} from '@mui/material';
// FIX: Use standard path, but we will use the new 'size' props
import Grid from '@mui/material/Grid'; 
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import TicketService from '../services/ticket.service';
import AuthService from '../services/auth.service';

export default function BranchDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();

  // --- LOAD DATA ---
  useEffect(() => {
    const fetchTickets = async () => {
        try {
            const res = await TicketService.getAllTickets();
            const myTickets = res.data.filter(t => t.createdBy?.username === user.username);
            setTickets(myTickets.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error("Error loading tickets", error);
        }
    };
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, [user.username]);

  // --- STATS ---
  const stats = {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'OPEN').length,
      active: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'error';       
      case 'IN_PROGRESS': return 'warning'; 
      case 'RESOLVED': return 'success';   
      default: return 'default';
    }
  };

  const StatCard = ({ title, count, color }) => (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #eee', borderRadius: 3, bgcolor: `${color}08` }}>
        <CardContent sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: color, mb: 0.5 }}>{count}</Typography>
            <Typography variant="body2" color="textSecondary" fontWeight="600">{title}</Typography>
        </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
            <Typography variant="h4" fontWeight="800" color="primary" gutterBottom>
                Branch Portal
            </Typography>
            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                <LocationOnIcon fontSize="small" />
                <Typography variant="body1">{user.username}</Typography>
            </Box>
        </Box>
        <Button 
            variant="contained" 
            size="large" 
            startIcon={<AddCircleIcon />} 
            onClick={() => navigate('/create-ticket')}
            sx={{ borderRadius: 3, px: 3, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
        >
            Raise New Ticket
        </Button>
      </Box>

      {/* STATS SECTION */}
      {/* FIX: Using 'container' and 'size' prop correctly for MUI v6 */}
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 6, md: 3 }}>
            <StatCard title="Total Raised" count={stats.total} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
            <StatCard title="Pending" count={stats.pending} color="#d32f2f" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
            <StatCard title="Processing" count={stats.active} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
            <StatCard title="Completed" count={stats.resolved} color="#2e7d32" />
        </Grid>
      </Grid>

      {/* RECENT TICKETS SECTION */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <HistoryIcon /> Recent Activity
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {tickets.map((ticket) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={ticket.id}>
                <Card 
                    elevation={0}
                    sx={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 3, 
                        transition: '0.2s',
                        cursor: 'pointer',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                    }}
                    onClick={() => setSelectedTicket(ticket)}
                >
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                             <Chip label={ticket.ticketNumber} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                             <Chip label={ticket.status.replace('_', ' ')} color={getStatusColor(ticket.status)} size="small" sx={{ fontWeight: 'bold' }} />
                        </Box>
                        <Typography variant="body1" fontWeight="600" gutterBottom noWrap>
                            {typeof ticket.errorType === 'string' ? ticket.errorType : "Issue Reported"}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                            {ticket.description}
                        </Typography>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="textSecondary">
                            {new Date(ticket.createdAt).toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        ))}
      </Grid>

      {/* DIALOG POPUP */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">{selectedTicket.ticketNumber}</Typography>
                <IconButton onClick={() => setSelectedTicket(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
                <Box mb={2}>
                    <Typography variant="caption" color="textSecondary">STATUS</Typography>
                    <br />
                    <Chip label={selectedTicket.status} color={getStatusColor(selectedTicket.status)} sx={{ mt: 0.5 }} />
                </Box>
                <Box mb={2}>
                    <Typography variant="caption" color="textSecondary">DESCRIPTION</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#fafafa' }}>
                        {selectedTicket.description}
                    </Paper>
                </Box>
                {selectedTicket.assignedTo && (
                    <Box>
                        <Typography variant="caption" color="textSecondary">HANDLED BY</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTicket.assignedTo.username}</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSelectedTicket(null)}>Close</Button>
            </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}