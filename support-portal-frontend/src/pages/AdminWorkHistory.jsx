import React, { useEffect, useState } from 'react';
import { 
  Container, Paper, Typography, Box, Chip, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, Button, Divider, Avatar, 
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download'; // <--- NEW ICON
import jsPDF from 'jspdf'; // <--- NEW IMPORT
import autoTable from 'jspdf-autotable'; // <--- NEW IMPORT
import api from '../api/axiosConfig';
import AuthService from '../services/auth.service';

export default function AdminWorkHistory() {
  // Data States
  const [myTickets, setMyTickets] = useState([]); 
  const [filteredTickets, setFilteredTickets] = useState([]); 
  
  // Reference Data
  const [branches, setBranches] = useState([]);
  const [errorTypes, setErrorTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filter States
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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

      setBranches(branchRes.data);
      setErrorTypes(typeRes.data);
      setCategories(catRes.data);

      const allTickets = ticketRes.data;
      const myWork = allTickets.filter(t => t.assignedTo?.username === currentUser.username);
      
      myWork.sort((a, b) => {
          if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
          if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setMyTickets(myWork);
      setFilteredTickets(myWork);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(() => fetchData(), 5000); 
    return () => clearInterval(interval); 
  }, []);

  // --- 2. FILTER LOGIC ---
  useEffect(() => {
    let result = myTickets;

    if (filterBranch !== 'All') {
        result = result.filter(t => {
            const bName = branches.find(b => b.id === t.branchId)?.name || 'Unknown';
            return bName === filterBranch;
        });
    }

    if (filterStatus !== 'All') {
        result = result.filter(t => t.status === filterStatus);
    }

    if (dateRange.start) {
        result = result.filter(t => t.createdAt >= dateRange.start);
    }
    if (dateRange.end) {
        result = result.filter(t => t.createdAt <= dateRange.end + "T23:59:59");
    }

    setFilteredTickets(result);
  }, [myTickets, filterBranch, filterStatus, dateRange, branches]);

  // --- 3. PDF GENERATION ---
  const generatePDF = () => {
    const doc = new jsPDF();

    // 1. Header
    doc.setFillColor(25, 118, 210); // Primary Blue
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`Work History: ${currentUser.username}`, 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 15);

    // 2. Filter Summary
    doc.setTextColor(0, 0, 0);
    let filterText = `Total Jobs: ${filteredTickets.length}`;
    if (filterStatus !== 'All') filterText += ` | Status: ${filterStatus}`;
    if (filterBranch !== 'All') filterText += ` | Branch: ${filterBranch}`;
    doc.text(filterText, 14, 32);

    // 3. Table Data
    const tableColumn = ["Ticket #", "Date", "Branch", "Issue Type", "Priority", "Status"];
    const tableRows = [];

    filteredTickets.forEach(row => {
        const errorInfo = getErrorDetails(row.errorTypeId);
        const bName = getBranchName(row.branchId);
        
        const rowData = [
            row.ticketNumber,
            new Date(row.createdAt).toLocaleDateString(),
            bName,
            `${errorInfo.category} - ${errorInfo.type}`,
            row.priority,
            row.status.replace('_', ' ')
        ];
        tableRows.push(rowData);
    });

    // 4. Generate Table
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 36,
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210] },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // 5. Save
    doc.save(`My_Work_History_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // --- HELPERS ---
  const getBranchName = (id) => branches.find(b => b.id === id)?.name || 'Unknown';
  
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
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    const filename = path.split(/[/\\]/).pop(); 
    return `http://localhost:8080/uploads/${filename}`;
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await api.put(`/api/v1/tickets/${selectedTicket.id}/status`, { status: newStatus, username: currentUser.username });
      setSelectedTicket(null);
      fetchData(); 
      alert(`Job marked as ${newStatus}!`);
    } catch (error) { alert("Failed to update status."); }
  };

  const clearFilters = () => {
      setFilterBranch('All');
      setFilterStatus('All');
      setDateRange({ start: '', end: '' });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'IN_PROGRESS': return 'warning'; 
      case 'RESOLVED': return 'success';   
      default: return 'default';
    }
  };

  const getPriorityColor = (p) => {
    if(p === 'HIGH') return '#ef5350'; 
    if(p === 'MEDIUM') return '#ff9800'; 
    return '#66bb6a'; 
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h4" fontWeight="800" color="primary">
                My Work History
            </Typography>
            <Typography variant="body1" color="textSecondary">
                Tickets managed by <strong>{currentUser.username}</strong>
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<DownloadIcon />} 
            onClick={generatePDF}
            sx={{ fontWeight: 'bold' }}
        >
            Export PDF
        </Button>
      </Box>

      {/* --- FILTERS --- */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <FilterListIcon sx={{ mr: 1 }} /> Filter:
            </Grid>
            
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} bgcolor="white">
                    <MenuItem value="All">All Statuses</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
                <TextField select fullWidth size="small" label="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} bgcolor="white">
                    <MenuItem value="All">All Branches</MenuItem>
                    {branches.map(b => <MenuItem key={b.id} value={b.name}>{b.name}</MenuItem>)}
                </TextField>
            </Grid>

            <Grid item xs={6} md={2}>
                <TextField type="date" fullWidth size="small" label="From" InputLabelProps={{ shrink: true }} value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
            </Grid>
            <Grid item xs={6} md={2}>
                <TextField type="date" fullWidth size="small" label="To" InputLabelProps={{ shrink: true }} value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
            </Grid>

            <Grid item xs={12} md={2} display="flex" justifyContent="flex-end">
                <Button size="small" color="error" startIcon={<RefreshIcon />} onClick={clearFilters}>
                    Clear
                </Button>
            </Grid>
        </Grid>
      </Paper>

      {/* --- TABLE SECTION --- */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Ticket ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Issue Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTickets.length > 0 ? filteredTickets.map((row) => {
                const errorInfo = getErrorDetails(row.errorTypeId);
                const dateTime = formatDateTime(row.createdAt);

                return (
                  <TableRow 
                    key={row.id} 
                    hover 
                    sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                    onClick={() => setSelectedTicket(row)}
                  >
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {row.ticketNumber}
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2">{dateTime.date}</Typography>
                        <Typography variant="caption" color="textSecondary">{dateTime.time}</Typography>
                    </TableCell>
                    <TableCell>{getBranchName(row.branchId)}</TableCell>
                    <TableCell>
                        <Typography variant="body2" fontWeight="500">{errorInfo.type}</Typography>
                        <Typography variant="caption" color="textSecondary">{errorInfo.category}</Typography>
                    </TableCell>
                    <TableCell>
                         <Chip 
                            label={row.priority} 
                            size="small" 
                            sx={{ 
                                bgcolor: `${getPriorityColor(row.priority)}15`, 
                                color: getPriorityColor(row.priority), 
                                fontWeight: 'bold', border: `1px solid ${getPriorityColor(row.priority)}` 
                            }} 
                         />
                    </TableCell>
                    <TableCell>
                        <Chip label={row.status.replace('_', ' ')} color={getStatusColor(row.status)} size="small" variant="filled" />
                    </TableCell>
                    <TableCell align="right">
                        <IconButton size="small" color="primary">
                            <VisibilityIcon />
                        </IconButton>
                    </TableCell>
                  </TableRow>
                );
            }) : (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">No tickets found matching your filters.</Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- POPUP DIALOG --- */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" fontWeight="bold">{selectedTicket.ticketNumber}</Typography>
                <Chip label={selectedTicket.priority} size="small" 
                    sx={{ bgcolor: selectedTicket.priority === 'HIGH' ? '#ffebee' : '#e8f5e9', color: selectedTicket.priority === 'HIGH' ? '#c62828' : '#2e7d32', fontWeight: 'bold' }} 
                />
            </Box>
            <IconButton onClick={() => setSelectedTicket(null)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={3} mt={0}>
                {/* LEFT COL: DETAILS & IMAGES */}
                <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>ISSUE DESCRIPTION</Typography>
                    <Typography paragraph sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, border: '1px solid #eee', color: '#444' }}>
                        {selectedTicket.description}
                    </Typography>
                    
                    <Grid container spacing={2} mt={1} mb={3}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">BRANCH</Typography>
                            <Typography variant="body2" fontWeight="600">{getBranchName(selectedTicket.branchId)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">CATEGORY</Typography>
                            <Typography variant="body2" fontWeight="600">{getErrorDetails(selectedTicket.errorTypeId).category}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">CREATED BY</Typography>
                            <Typography variant="body2" fontWeight="600">{selectedTicket.createdBy?.username || "Unknown"}</Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>ATTACHMENTS</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {selectedTicket.imagePaths && selectedTicket.imagePaths.length > 0 ? (
                            selectedTicket.imagePaths.map((path, index) => (
                                <Box 
                                    key={index}
                                    component="img"
                                    src={getImageUrl(path)}
                                    alt="Att."
                                    sx={{ 
                                        width: 100, height: 100, objectFit: 'cover', 
                                        borderRadius: 2, border: '1px solid #eee', cursor: 'pointer',
                                        '&:hover': { opacity: 0.8 }
                                    }}
                                    onClick={() => window.open(getImageUrl(path), '_blank')}
                                />
                            ))
                        ) : (
                            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                <ImageNotSupportedIcon fontSize="small" />
                                <Typography variant="body2">No images</Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* RIGHT COL: STATUS BOX */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" color="#1565c0" gutterBottom fontWeight="bold">TICKET STATUS</Typography>
                        <Chip label={selectedTicket.status.replace('_', ' ')} color={getStatusColor(selectedTicket.status)} sx={{ width: '100%', mb: 3, fontWeight: 'bold' }} />
                        
                        <Typography variant="subtitle2" color="#1565c0" gutterBottom fontWeight="bold">ASSIGNED TO</Typography>
                        <Box display="flex" alignItems="center" gap={1.5}>
                             <Avatar sx={{ width: 36, height: 36, bgcolor: '#1565c0' }}>{selectedTicket.assignedTo?.username.charAt(0).toUpperCase() || "?"}</Avatar>
                             <Typography fontWeight="bold" color="#0d47a1">{selectedTicket.assignedTo ? selectedTicket.assignedTo.username : "Unassigned"}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
            <Button startIcon={<ChatIcon />} variant="outlined" sx={{ borderRadius: 2 }} onClick={() => alert("Chat...")}>Chat</Button>
            <Box>
                {selectedTicket.status === 'IN_PROGRESS' && (
                    <Button variant="contained" color="success" disableElevation sx={{ borderRadius: 2 }} startIcon={<CheckCircleIcon />} onClick={() => handleStatusChange('RESOLVED')}>Resolve Ticket</Button>
                )}
            </Box>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}