import { useEffect, useState } from 'react';
import { 
  Grid, Paper, Typography, Button, Chip, Box, Container, IconButton, TextField, 
  ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, 
  MenuItem, Divider, Snackbar, Alert 
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AddCircleIcon from '@mui/icons-material/AddCircle'; 
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import AuthService from '../services/auth.service';
import TicketService from '../services/ticket.service';
import { useNavigate } from 'react-router-dom';

export default function BranchDashboard() {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  const [tickets, setTickets] = useState([]);
  const [viewMode, setViewMode] = useState('today'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [openCreate, setOpenCreate] = useState(false); 
  const [selectedTicket, setSelectedTicket] = useState(null); 
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Form State
  const [newTicket, setNewTicket] = useState({
    branchName: currentUser?.username || 'Branch', // Default to username if branch not set
    errorCategory: '',
    errorType: '',
    description: ''
  });

  // HARDCODED SETTINGS (Since we haven't built Settings API yet)
  const settings = {
    branches: ["Head Office", "Gampaha", "Kandy", "Galle", "Kurunegala"],
    errorCategories: ["Hardware", "Software", "Network", "Printer"],
    errorTypes: [
        { name: "PC Not Turning On", category: "Hardware" },
        { name: "Monitor Flickering", category: "Hardware" },
        { name: "Cannot Login", category: "Software" },
        { name: "Internet Slow", category: "Network" },
        { name: "Paper Jam", category: "Printer" }
    ]
  };

  const loadData = async () => {
    try {
      const response = await TicketService.getAllTickets();
      // Filter for this user only
      // Note: In a real app, the backend should filter this, but we do it here for now
      setTickets(response.data);
    } catch (error) {
      console.error("Error loading tickets", error);
    }
  };

  useEffect(() => { 
    if(!currentUser) navigate("/login");
    loadData();
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const getFilteredTickets = () => {
    // Basic filtering logic
    return tickets.filter(t => {
        if (viewMode === 'today') {
            return t.status !== 'COMPLETED'; // Simplified logic
        }
        return true;
    });
  };

  const displayedTickets = getFilteredTickets();
  const filteredTypes = settings.errorTypes.filter(t => t.category === newTicket.errorCategory);

  const handleSubmit = async () => {
    try {
      // Use the Service
      await TicketService.createTicket({
        description: newTicket.description,
        priority: "MEDIUM", // Default
        // We map your fields to what the Java Backend expects:
        // You might need to add 'category' to your Java Entity if you want to save it
      });

      setOpenCreate(false); 
      setNewTicket({ branchName: currentUser.username, errorCategory: '', errorType: '', description: '' }); 
      loadData(); 
      setToast({ open: true, message: 'Ticket Sent Successfully!', severity: 'success' });
    } catch (error) {
        setToast({ open: true, message: 'Failed to send ticket', severity: 'error' });
    }
  };

  const downloadJobCard = (e, ticket) => {
    e.stopPropagation(); 
    const doc = new jsPDF();
    doc.text(`Job Card - ${ticket.id}`, 10, 20);
    doc.text(`Description: ${ticket.description}`, 10, 30);
    doc.save(`JobCard_${ticket.id}.pdf`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {currentUser?.username} Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Manage your branch support requests.
            </Typography>
        </div>
        <Box>
            <Button variant="contained" size="large" startIcon={<AddCircleIcon />} onClick={() => setOpenCreate(true)} sx={{ mr: 2 }}>
                Raise New Ticket
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Logout
            </Button>
        </Box>
      </Box>

      {/* FILTERS */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <ToggleButtonGroup color="primary" value={viewMode} exclusive onChange={(e, newView) => { if(newView) setViewMode(newView); }}>
              <ToggleButton value="today">Active</ToggleButton>
              <ToggleButton value="history">History</ToggleButton>
            </ToggleButtonGroup>
             <TextField size="small" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}/>
        </Box>
      </Paper>

      {/* TICKET GRID */}
      <Grid container spacing={3} alignItems="stretch">
        {displayedTickets.map((ticket) => (
            <Grid item xs={12} md={6} lg={4} key={ticket.id} sx={{ display: 'flex' }}>
               <Paper 
                   onClick={() => setSelectedTicket(ticket)}
                   sx={{ 
                       p: 2, width: '100%', cursor: 'pointer', transition: '0.2s', '&:hover': { boxShadow: 6 },
                       borderLeft: `6px solid ${ticket.status === 'PENDING' ? '#d32f2f' : ticket.status === 'IN_PROGRESS' ? '#ed6c02' : '#2e7d32'}` 
                   }}
               >
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary">#{ticket.id}</Typography>
                    <IconButton size="small" onClick={(e) => downloadJobCard(e, ticket)}><PrintIcon fontSize="small" /></IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary">{ticket.status}</Typography>
                <Typography sx={{ mt: 1, mb: 2 }}>{ticket.description}</Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Chip label={ticket.priority} size="small" color={ticket.priority === 'HIGH' ? 'error' : 'default'} />
                </Box>
              </Paper>
            </Grid>
        ))}
      </Grid>

      {/* CREATE TICKET MODAL */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Raise New Ticket</DialogTitle>
        <DialogContent>
            <TextField select fullWidth label="Branch" margin="normal" value={newTicket.branchName} onChange={(e) => setNewTicket({...newTicket, branchName: e.target.value})}>
                {settings.branches.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>

            <TextField select fullWidth label="Category" margin="normal" value={newTicket.errorCategory} onChange={(e) => setNewTicket({...newTicket, errorCategory: e.target.value})}>
                {settings.errorCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>

            <TextField fullWidth label="Description" multiline rows={3} margin="normal" value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
      
    </Container>
  );
}