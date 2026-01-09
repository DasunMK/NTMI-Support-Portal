import React, { useEffect, useState } from 'react';
import { 
  Container, Card, CardContent, Typography, Chip, Box, 
  TextField, InputAdornment, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Divider, Avatar, Paper, Stack, Tooltip 
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import api from '../api/axiosConfig';
import AuthService from '../services/auth.service';

// --- CHARTS ---
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip 
} from 'recharts';

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [errorTypes, setErrorTypes] = useState([]); 
  const [categories, setCategories] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null); 
  const currentUser = AuthService.getCurrentUser();

  // --- 1. LOAD DATA ---
  const fetchData = async () => {
    try {
      const [ticketRes, branchRes, typeRes, catRes] = await Promise.all([
        api.get('/api/v1/tickets'),
        api.get('/api/v1/settings/branches'),
        api.get('/api/v1/settings/types'),
        api.get('/api/v1/settings/categories')
      ]);
      setTickets(ticketRes.data);
      setBranches(branchRes.data);
      setErrorTypes(typeRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(() => fetchData(), 5000); 
    return () => clearInterval(interval); 
  }, []);

  // --- HELPERS ---
  const getBranchName = (id) => branches.find(b => b.id === id)?.name || 'Unknown Branch';
  
  const getErrorDetails = (typeId) => {
      const type = errorTypes.find(t => t.id === typeId);
      if (!type) return { type: 'Unknown', category: 'Unknown' };
      if (type.category && type.category.name) return { type: type.name, category: type.category.name };
      const cat = categories.find(c => c.id === type.categoryId);
      return { type: type.name, category: cat ? cat.name : 'Unknown' };
  };

  const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
  };

  const getImageUrl = (path) => {
      if (!path) return '';
      const filename = path.split(/[/\\]/).pop(); 
      return `http://localhost:8080/uploads/${filename}`;
  };

  // Stats
  const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length
  };

  // Chart Data
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

  const priorityData = [
    { name: 'High', value: tickets.filter(t => t.priority === 'HIGH').length },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'MEDIUM').length },
    { name: 'Low', value: tickets.filter(t => t.priority === 'LOW').length },
  ];
  const COLORS = ['#ef5350', '#ff9800', '#66bb6a']; 

  const getSortedTickets = () => {
    return tickets
      .filter(t => t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const statusWeight = (status) => (status === 'RESOLVED' ? 1 : 0);
        if (statusWeight(a.status) !== statusWeight(b.status)) return statusWeight(a.status) - statusWeight(b.status);
        const pWeight = (p) => (p === 'HIGH' ? 0 : p === 'MEDIUM' ? 1 : 2);
        if (pWeight(a.priority) !== pWeight(b.priority)) return pWeight(a.priority) - pWeight(b.priority);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await api.put(`/api/v1/tickets/${selectedTicket.id}/status`, { status: newStatus, username: currentUser.username });
      setSelectedTicket(null);
      fetchData(); 
      alert(`Ticket updated successfully!`);
    } catch (error) { alert("Failed to update status."); }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'OPEN': return { color: 'error', label: 'Open', borderColor: '#ef5350', bg: '#fff5f5' };       
      case 'IN_PROGRESS': return { color: 'warning', label: 'In Progress', borderColor: '#ff9800', bg: '#fff8e1' }; 
      case 'RESOLVED': return { color: 'success', label: 'Resolved', borderColor: '#66bb6a', bg: '#f1f8e9' };   
      default: return { color: 'default', label: status, borderColor: '#e0e0e0', bg: '#ffffff' };
    }
  };

  const StatCard = ({ title, count, icon, color }) => (
    <Card elevation={0} sx={{ height: '100%', display: 'flex', alignItems: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 3 }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: `${color}15`, mr: 2 }}>
            {React.cloneElement(icon, { sx: { color: color, fontSize: 28 } })}
        </Box>
        <Box>
            <Typography variant="body2" color="textSecondary" fontWeight="600">{title}</Typography>
            <Typography variant="h5" fontWeight="bold" color="textPrimary">{count}</Typography>
        </Box>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
            <Typography variant="h4" fontWeight="800" color="textPrimary">Admin Dashboard</Typography>
            <Typography variant="body2" color="textSecondary">Welcome back, {currentUser.username}</Typography>
        </Box>
        <Chip icon={<AccessTimeIcon />} label="Live Updates Active" color="success" size="small" variant="outlined" />
      </Box>

      {/* --- STATS --- */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}> <StatCard title="Total Tickets" count={stats.total} icon={<AssignmentIcon />} color="#1976d2" /> </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}> <StatCard title="Pending" count={stats.open} icon={<BugReportIcon />} color="#ef5350" /> </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}> <StatCard title="In Progress" count={stats.inProgress} icon={<PendingActionsIcon />} color="#ff9800" /> </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}> <StatCard title="Resolved" count={stats.resolved} icon={<TaskAltIcon />} color="#66bb6a" /> </Grid>
      </Grid>

      {/* --- CHARTS --- */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ p: 3, height: 400, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Branch Workload</Typography>
                <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={branchChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{fill: '#f5f5f5'}} />
                            <Legend />
                            <Bar dataKey="High" stackId="a" fill="#ef5350" radius={[0,0,4,4]} />
                            <Bar dataKey="Medium" stackId="a" fill="#ff9800" />
                            <Bar dataKey="Low" stackId="a" fill="#66bb6a" radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ p: 3, height: 400, border: '1px solid #e0e0e0', borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Priority Distribution</Typography>
                <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                {priorityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>
        </Grid>
      </Grid>

      {/* --- ACTIVE TICKETS --- */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Active Tickets</Typography>
        <TextField
          variant="outlined" size="small" placeholder="Search ID or Description..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          sx={{ width: 320, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
      </Box>

      <Grid container spacing={3}>
        {getSortedTickets().map((ticket) => {
            const errorInfo = getErrorDetails(ticket.errorTypeId);
            const statusConfig = getStatusConfig(ticket.status);
            const dateInfo = formatDateTime(ticket.createdAt);

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={ticket.id}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', flexDirection: 'column',
                    cursor: 'pointer', 
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    borderLeft: `5px solid ${statusConfig.borderColor}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 20px rgba(0,0,0,0.08)' },
                    bgcolor: ticket.status === 'RESOLVED' ? '#fafafa' : 'white'
                  }}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    
                    {/* HEADER: ID & STATUS */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#2c3e50', lineHeight: 1.2 }}>
                                {ticket.ticketNumber}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 14 }} /> {dateInfo.date}, {dateInfo.time}
                            </Typography>
                        </Box>
                        <Chip 
                            label={statusConfig.label} 
                            size="small" 
                            sx={{ 
                                bgcolor: statusConfig.bg, 
                                color: statusConfig.borderColor, 
                                fontWeight: 'bold',
                                border: `1px solid ${statusConfig.borderColor}40`
                            }}
                        />
                    </Box>

                    {/* DETAILS LIST */}
                    <Stack spacing={1.5} mb={2}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#f5f5f5' }}>
                                <LocationOnIcon sx={{ fontSize: 14, color: '#757575' }} />
                            </Avatar>
                            <Typography variant="body2" fontWeight="500" color="textPrimary">
                                {getBranchName(ticket.branchId)}
                            </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#f5f5f5' }}>
                                <CategoryIcon sx={{ fontSize: 14, color: '#757575' }} />
                            </Avatar>
                            <Typography variant="body2" color="textSecondary">
                                {errorInfo.category}
                            </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#f5f5f5' }}>
                                <BugReportIcon sx={{ fontSize: 14, color: '#757575' }} />
                            </Avatar>
                            <Typography variant="body2" color="textSecondary">
                                {errorInfo.type}
                            </Typography>
                        </Box>
                    </Stack>

                    <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                    {/* FOOTER: ASSIGNEE */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <Tooltip title={ticket.assignedTo ? "Assigned Admin" : "Unassigned"}>
                                <Avatar 
                                    sx={{ 
                                        width: 28, height: 28, 
                                        fontSize: 12, fontWeight: 'bold',
                                        bgcolor: ticket.assignedTo ? '#1976d2' : '#e0e0e0',
                                        color: ticket.assignedTo ? 'white' : '#757575'
                                    }}
                                >
                                    {ticket.assignedTo ? ticket.assignedTo.username.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 16 }} />}
                                </Avatar>
                            </Tooltip>
                            <Typography variant="caption" fontWeight="600" color={ticket.assignedTo ? 'textPrimary' : 'textSecondary'}>
                                {ticket.assignedTo ? ticket.assignedTo.username : "Unassigned"}
                            </Typography>
                        </Box>
                         <Tooltip title={`Priority: ${ticket.priority}`}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ticket.priority === 'HIGH' ? '#ef5350' : ticket.priority === 'MEDIUM' ? '#ff9800' : '#66bb6a' }} />
                        </Tooltip>
                    </Box>

                  </CardContent>
                </Card>
              </Grid>
            );
        })}
      </Grid>

      {/* --- POPUP DIALOG --- */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
            <Box display="flex" alignItems="center" gap={2}>
                {/* FIX: Removed nested Typography h6 inside h2 */}
                <Typography component="span" variant="h6" fontWeight="bold">{selectedTicket.ticketNumber}</Typography>
                <Chip label={selectedTicket.priority} size="small" 
                    sx={{ bgcolor: selectedTicket.priority === 'HIGH' ? '#ffebee' : '#e8f5e9', color: selectedTicket.priority === 'HIGH' ? '#c62828' : '#2e7d32', fontWeight: 'bold' }} 
                />
            </Box>
            <IconButton onClick={() => setSelectedTicket(null)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={3} mt={0}>
                {/* LEFT COL: DETAILS & IMAGES */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>ISSUE DESCRIPTION</Typography>
                    <Typography paragraph sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, border: '1px solid #eee', color: '#444' }}>
                        {selectedTicket.description}
                    </Typography>
                    
                    <Grid container spacing={2} mt={1} mb={3}>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="textSecondary">BRANCH</Typography>
                            <Typography variant="body2" fontWeight="600">{getBranchName(selectedTicket.branchId)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="textSecondary">CATEGORY</Typography>
                            <Typography variant="body2" fontWeight="600">{getErrorDetails(selectedTicket.errorTypeId).category}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="textSecondary">ERROR TYPE</Typography>
                            <Typography variant="body2" fontWeight="600">{getErrorDetails(selectedTicket.errorTypeId).type}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="textSecondary">CREATED AT</Typography>
                            <Typography variant="body2" fontWeight="600">{formatDateTime(selectedTicket.createdAt).date} {formatDateTime(selectedTicket.createdAt).time}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="caption" color="textSecondary">CREATED BY</Typography>
                            <Typography variant="body2" fontWeight="600">{selectedTicket.createdBy ? selectedTicket.createdBy.username : "Unknown"}</Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 2 }} />

                    {/* IMAGES SECTION */}
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>ATTACHMENTS</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {selectedTicket.imagePaths && selectedTicket.imagePaths.length > 0 ? (
                            selectedTicket.imagePaths.map((path, index) => (
                                <Box 
                                    key={index}
                                    component="img"
                                    src={getImageUrl(path)}
                                    alt={`Attachment ${index + 1}`}
                                    sx={{ 
                                        width: 100, height: 100, 
                                        objectFit: 'cover', 
                                        borderRadius: 2, 
                                        border: '1px solid #eee',
                                        cursor: 'pointer',
                                        '&:hover': { opacity: 0.8 }
                                    }}
                                    onClick={() => window.open(getImageUrl(path), '_blank')}
                                />
                            ))
                        ) : (
                            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                <ImageNotSupportedIcon fontSize="small" />
                                <Typography variant="body2">No images uploaded</Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* RIGHT COL: STATUS BOX */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5faff', borderRadius: 2, border: '1px solid #dbeafe' }}>
                        <Typography variant="subtitle2" color="#1e40af" gutterBottom fontWeight="bold">TICKET STATUS</Typography>
                        <Chip label={selectedTicket.status.replace('_', ' ')} color={getStatusConfig(selectedTicket.status).color} sx={{ width: '100%', mb: 3, fontWeight: 'bold' }} />
                        
                        <Typography variant="subtitle2" color="#1e40af" gutterBottom fontWeight="bold">ASSIGNED TO</Typography>
                        <Box display="flex" alignItems="center" gap={1.5}>
                             <Avatar sx={{ width: 36, height: 36, bgcolor: '#1e40af' }}>{selectedTicket.assignedTo?.username.charAt(0).toUpperCase() || "?"}</Avatar>
                             <Typography fontWeight="bold" color="#1e3a8a">{selectedTicket.assignedTo ? selectedTicket.assignedTo.username : "Unassigned"}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
            <Button startIcon={<ChatIcon />} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }} onClick={() => alert("Chat feature opening...")}>Chat with Branch</Button>
            <Box>
                {selectedTicket.status === 'OPEN' && (
                    <Button variant="contained" disableElevation sx={{ borderRadius: 2, textTransform: 'none' }} startIcon={<PlayCircleFilledWhiteIcon />} onClick={() => handleStatusChange('IN_PROGRESS')}>Start Ticket</Button>
                )}
                {selectedTicket.status === 'IN_PROGRESS' && (
                    selectedTicket.assignedTo?.username === currentUser.username ? (
                        <Button variant="contained" color="success" disableElevation sx={{ borderRadius: 2, textTransform: 'none' }} startIcon={<CheckCircleIcon />} onClick={() => handleStatusChange('RESOLVED')}>Resolve Ticket</Button>
                    ) : <Button variant="contained" disabled sx={{ borderRadius: 2, textTransform: 'none' }}>Locked by {selectedTicket.assignedTo?.username}</Button>
                )}
            </Box>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}