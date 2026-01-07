import React, { useEffect, useState } from 'react';
import { 
  Container, Grid, Card, CardContent, Typography, Chip, Box, 
  TextField, InputAdornment, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Divider, Avatar, Paper 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import BugReportIcon from '@mui/icons-material/BugReport';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import api from '../api/axiosConfig';
import AuthService from '../services/auth.service';

// --- CHARTS ---
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null); 
  const currentUser = AuthService.getCurrentUser();

  // --- 1. LOAD DATA FUNCTION ---
  const fetchData = async () => {
    try {
      // We use Promise.all to fetch both endpoints in parallel
      const [ticketRes, branchRes] = await Promise.all([
        api.get('/api/v1/tickets'),
        api.get('/api/v1/settings/branches')
      ]);
      setTickets(ticketRes.data);
      setBranches(branchRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // --- 2. AUTO-REFRESH (POLLING) ---
  useEffect(() => { 
    fetchData(); // 1. Run immediately when page loads

    const interval = setInterval(() => {
        fetchData(); // 2. Run again every 5 seconds
    }, 5000); // 5000ms = 5 seconds

    return () => clearInterval(interval); // 3. Cleanup when leaving the page
  }, []);

  // --- 3. CALCULATE STATS ---
  const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length
  };

  // Chart Data
  const statusData = [
    { name: 'Open', count: stats.open },
    { name: 'In Progress', count: stats.inProgress },
    { name: 'Resolved', count: stats.resolved },
  ];

  const priorityData = [
    { name: 'High', value: tickets.filter(t => t.priority === 'HIGH').length },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'MEDIUM').length },
    { name: 'Low', value: tickets.filter(t => t.priority === 'LOW').length },
  ];
  const COLORS = ['#d32f2f', '#ed6c02', '#2e7d32']; 

  const branchChartData = branches.map(branch => {
      const branchTickets = tickets.filter(t => t.branchId === branch.id);
      return {
          name: branch.name,
          High: branchTickets.filter(t => t.priority === 'HIGH').length,
          Medium: branchTickets.filter(t => t.priority === 'MEDIUM').length,
          Low: branchTickets.filter(t => t.priority === 'LOW').length,
          total: branchTickets.length
      };
  }).sort((a, b) => b.total - a.total).slice(0, 10); 

  // --- 4. SORTING LOGIC ---
  const getSortedTickets = () => {
    return tickets
      .filter(t => 
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const statusWeight = (status) => (status === 'RESOLVED' ? 1 : 0);
        if (statusWeight(a.status) !== statusWeight(b.status)) return statusWeight(a.status) - statusWeight(b.status);
        
        const pWeight = (p) => (p === 'HIGH' ? 0 : p === 'MEDIUM' ? 1 : 2);
        if (pWeight(a.priority) !== pWeight(b.priority)) return pWeight(a.priority) - pWeight(b.priority);
        
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  };

  // --- 5. ACTIONS ---
  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await api.put(`/api/v1/tickets/${selectedTicket.id}/status`, {
        status: newStatus,
        username: currentUser.username 
      });
      setSelectedTicket(null);
      fetchData(); // Immediate refresh after action
      alert(`Ticket updated to ${newStatus.replace('_', ' ')} successfully!`);
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  // --- HELPERS ---
  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'error';       
      case 'IN_PROGRESS': return 'warning'; 
      case 'RESOLVED': return 'success';   
      default: return 'default';
    }
  };

  const getStatusBorderColor = (status) => {
    switch(status) {
      case 'OPEN': return '#d32f2f';       
      case 'IN_PROGRESS': return '#ed6c02'; 
      case 'RESOLVED': return '#2e7d32';    
      default: return '#9e9e9e';            
    }
  };

  const getPriorityColor = (p) => {
    if(p === 'HIGH') return '#d32f2f'; 
    if(p === 'MEDIUM') return '#ed6c02'; 
    return '#2e7d32'; 
  };

  const getBranchName = (id) => {
      const branch = branches.find(b => b.id === id);
      return branch ? branch.name : `ID: ${id}`;
  };

  const StatCard = ({ title, count, icon, color }) => (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: `${color}20`, mr: 2 }}>
            {React.cloneElement(icon, { sx: { color: color, fontSize: 30 } })}
        </Box>
        <Box>
            <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">{title}</Typography>
            <Typography variant="h4" fontWeight="bold" color="textPrimary">{count}</Typography>
        </Box>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold" color="primary">
            Admin Dashboard
        </Typography>
        {/* Visual indicator that live updates are active */}
        <Chip label="Live Updates On" color="success" size="small" variant="outlined" />
      </Box>

      {/* --- SECTION 1: STATISTICS --- */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Tickets" count={stats.total} icon={<AssignmentIcon />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Open / Pending" count={stats.open} icon={<BugReportIcon />} color="#d32f2f" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="In Progress" count={stats.inProgress} icon={<PendingActionsIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Resolved" count={stats.resolved} icon={<TaskAltIcon />} color="#2e7d32" />
        </Grid>
      </Grid>

      {/* --- SECTION 2: CHARTS --- */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={3} sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Branch Health (Workload by Priority)</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="High" stackId="a" fill="#d32f2f" />
                        <Bar dataKey="Medium" stackId="a" fill="#ed6c02" />
                        <Bar dataKey="Low" stackId="a" fill="#2e7d32" />
                    </BarChart>
                </ResponsiveContainer>
            </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={3} sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Overall Risk Analysis</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {priorityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </Paper>
        </Grid>
      </Grid>

      {/* --- SECTION 3: SEARCH & TICKET LIST --- */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold" color="textSecondary">Active Tickets</Typography>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search tickets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
          sx={{ width: 300, bgcolor: 'white', borderRadius: 1 }}
        />
      </Box>

      <Grid container spacing={3}>
        {getSortedTickets().map((ticket) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={ticket.id}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: '0.3s',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 },
                borderLeft: `6px solid ${getStatusBorderColor(ticket.status)}`,
                bgcolor: ticket.status === 'RESOLVED' ? '#f1f8e9' : 'white' 
              }}
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Chip 
                    label={ticket.status.replace('_', ' ')} 
                    color={getStatusColor(ticket.status)} 
                    size="small" 
                    variant="filled"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{ticket.ticketNumber}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, mb: 2, minHeight: 60 }}>
                  {ticket.description}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="caption" fontWeight="bold">
                            {ticket.assignedTo ? ticket.assignedTo.username : "Unassigned"}
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: getPriorityColor(ticket.priority) }}>
                        {ticket.priority}
                    </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* --- POPUP DIALOG --- */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" fontWeight="bold">{selectedTicket.ticketNumber}</Typography>
                <Chip label={selectedTicket.priority} size="small" sx={{ bgcolor: getPriorityColor(selectedTicket.priority), color: 'white' }} />
            </Box>
            <IconButton onClick={() => setSelectedTicket(null)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Description:</Typography>
                    <Typography paragraph sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 1, border: '1px solid #eee' }}>{selectedTicket.description}</Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                        Branch: <strong>{getBranchName(selectedTicket.branchId)}</strong>
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">Created By: {selectedTicket.createdBy?.username || 'Unknown'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>Current Status</Typography>
                        <Chip label={selectedTicket.status.replace('_', ' ')} color={getStatusColor(selectedTicket.status)} sx={{ width: '100%', mb: 2, fontWeight: 'bold' }} />
                        <Typography variant="subtitle2" color="primary" gutterBottom>Assigned Admin</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>{selectedTicket.assignedTo?.username.charAt(0).toUpperCase() || "?"}</Avatar>
                            <Typography fontWeight="bold">{selectedTicket.assignedTo ? selectedTicket.assignedTo.username : "None"}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#f9f9f9', justifyContent: 'space-between' }}>
            <Button startIcon={<ChatIcon />} variant="outlined" onClick={() => alert("Chat feature opening...")}>Chat with User</Button>
            <Box>
                {selectedTicket.status === 'OPEN' && (
                    <Button variant="contained" color="primary" startIcon={<PlayCircleFilledWhiteIcon />} onClick={() => handleStatusChange('IN_PROGRESS')}>Start Ticket</Button>
                )}
                {selectedTicket.status === 'IN_PROGRESS' && (
                    selectedTicket.assignedTo?.username === currentUser.username ? (
                        <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleStatusChange('RESOLVED')}>Complete Job</Button>
                    ) : (
                        <Button variant="contained" disabled color="inherit">Locked by {selectedTicket.assignedTo?.username}</Button>
                    )
                )}
                {selectedTicket.status === 'RESOLVED' && (
                    <Typography variant="button" color="success.main" fontWeight="bold">Ticket Resolved</Typography>
                )}
            </Box>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}