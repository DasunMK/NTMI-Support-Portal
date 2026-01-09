import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, Grid, TextField, MenuItem, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import BuildIcon from '@mui/icons-material/Build'; 
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person'; 
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axiosConfig';

// 1. DISTINCT COLOR PALETTE FOR USERS
const PALETTE = [
  { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' }, // Blue
  { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' }, // Green
  { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' }, // Purple
  { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' }, // Orange
  { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' }, // Red
  { bg: '#e0f2f1', text: '#00695c', border: '#80cbc4' }, // Teal
];

export default function Reports() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [userColorMap, setUserColorMap] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);

  // --- FILTER STATES ---
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterUser, setFilterUser] = useState('All'); // Fixed By
  const [filterRaisedBy, setFilterRaisedBy] = useState('All'); 
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All'); 
  const [filterType, setFilterType] = useState('All');         
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // --- REFERENCE DATA ---
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [types, setTypes] = useState([]);  
  const [users, setUsers] = useState([]); // All users for dropdowns

  // --- 1. LOAD & MAP DATA ---
  const loadData = async () => {
    try {
      // Fetch everything in parallel
      const [ticketsRes, branchesRes, typesRes, catsRes] = await Promise.all([
        api.get('/api/v1/tickets'),
        api.get('/api/v1/settings/branches'),
        api.get('/api/v1/settings/types'),
        api.get('/api/v1/settings/categories')
      ]);

      const rawTickets = ticketsRes.data;
      const branchList = branchesRes.data;
      const typeList = typesRes.data;
      const catList = catsRes.data;

      // 1.1 Process Tickets: Map IDs to Names
      const processedTickets = rawTickets.map(t => {
          // Find Branch Name
          const branch = branchList.find(b => b.id === t.branchId);
          
          // Find Type and Category
          const type = typeList.find(tp => tp.id === t.errorTypeId);
          let categoryName = 'Unknown';
          let typeName = 'Unknown';

          if (type) {
              typeName = type.name;
              // Try to find category from type object or ID lookup
              if (type.category) {
                  categoryName = type.category.name;
              } else {
                  const cat = catList.find(c => c.id === type.categoryId);
                  categoryName = cat ? cat.name : 'Unknown';
              }
          }

          return {
              ...t,
              // Add helper properties for sorting/filtering
              branchName: branch ? branch.name : 'Unknown',
              errorCategory: categoryName,
              errorType: typeName,
              raisedByUsername: t.createdBy?.username || 'Unknown',
              completedByUsername: t.assignedTo?.username || null
          };
      });

      // Sort Newest First
      processedTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setBranches(branchList);
      setTypes(typeList);
      setCategories(catList);
      setTickets(processedTickets);
      setFilteredTickets(processedTickets);

      // Extract unique users for filters
      const uniqueRaisers = [...new Set(processedTickets.map(t => t.raisedByUsername))];
      const uniqueFixers = [...new Set(processedTickets.map(t => t.completedByUsername).filter(Boolean))];
      // Combine for color mapping
      const allUniqueUsers = [...new Set([...uniqueRaisers, ...uniqueFixers])];
      
      // Generate Color Map
      const newColorMap = {};
      allUniqueUsers.forEach((u, i) => {
          newColorMap[u] = PALETTE[i % PALETTE.length];
      });
      setUserColorMap(newColorMap);
      
      // Set User Dropdown Data
      setUsers({ raisers: uniqueRaisers, fixers: uniqueFixers });

    } catch (error) {
      console.error("Error loading report data", error);
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- 2. FILTER LOGIC ---
  useEffect(() => {
    let result = tickets;

    if (filterBranch !== 'All') result = result.filter(t => t.branchName === filterBranch);
    if (filterUser !== 'All') result = result.filter(t => t.completedByUsername === filterUser);
    if (filterRaisedBy !== 'All') result = result.filter(t => t.raisedByUsername === filterRaisedBy);
    if (filterCategory !== 'All') result = result.filter(t => t.errorCategory === filterCategory); 
    if (filterType !== 'All') result = result.filter(t => t.errorType === filterType);             
    if (filterStatus !== 'All') result = result.filter(t => t.status === filterStatus);
    
    if (dateRange.start) result = result.filter(t => t.createdAt >= dateRange.start);
    if (dateRange.end) result = result.filter(t => t.createdAt <= dateRange.end + "T23:59:59");

    setFilteredTickets(result);
  }, [tickets, filterBranch, filterUser, filterRaisedBy, filterCategory, filterType, filterStatus, dateRange]);

  // Dynamic Type Dropdown
  const availableTypes = filterCategory === 'All' 
    ? types 
    : types.filter(t => {
        const catId = t.category?.id || t.categoryId;
        const selectedCat = categories.find(c => c.name === filterCategory);
        return String(catId) === String(selectedCat?.id);
    });

  // --- 3. PDF GENERATOR ---
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("Support Ticket Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 16);

    // Filter Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let filterText = `Total Records: ${filteredTickets.length}`;
    if(filterBranch !== 'All') filterText += ` | Branch: ${filterBranch}`;
    if(filterStatus !== 'All') filterText += ` | Status: ${filterStatus}`;
    doc.text(filterText, 14, 32);

    const tableColumn = ["Ticket #", "Date", "Branch", "Issue", "Raised By", "Fixed By", "Status"];
    const tableRows = [];

    filteredTickets.forEach(t => {
      const ticketData = [
        t.ticketNumber,
        new Date(t.createdAt).toLocaleDateString(),
        t.branchName,
        `${t.errorCategory} - ${t.errorType}`,
        t.raisedByUsername,
        t.completedByUsername || "-",
        t.status
      ];
      tableRows.push(ticketData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`NTMI_Report_${new Date().toISOString().slice(0,10)}.pdf`);
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>Analytics & Reports</Typography>
          <Typography variant="body2" color="text.secondary">Detailed analysis of system performance and ticket history.</Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
           <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button>
           <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={generatePDF}>Export PDF</Button>
        </Box>
      </Box>

      {/* FILTERS */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
        <Grid container spacing={2} alignItems="center">
            
            <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontWeight: 'bold' }}>
                <FilterListIcon sx={{ mr: 1 }} /> Filters:
            </Grid>

            {/* Row 1 */}
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} bgcolor="white">
                    <MenuItem value="All">All Branches</MenuItem>
                    {branches.map((b) => <MenuItem key={b.id} value={b.name}>{b.name}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Raised By" value={filterRaisedBy} onChange={(e) => setFilterRaisedBy(e.target.value)}>
                    <MenuItem value="All">All Users</MenuItem>
                    {users.raisers && users.raisers.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Fixed By" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                    <MenuItem value="All">All Technicians</MenuItem>
                    {users.fixers && users.fixers.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <MenuItem value="All">All Statuses</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                </TextField>
            </Grid>
            
            {/* Clear Button (Responsive) */}
            <Grid item xs={12} md={3} sx={{ display: { xs: 'block', md: 'none' } }}>
                 <Button fullWidth size="small" color="error" variant="text" onClick={() => {
                    setFilterBranch('All'); setFilterUser('All'); setFilterRaisedBy('All'); 
                    setFilterStatus('All'); setFilterCategory('All'); setFilterType('All');
                    setDateRange({start:'', end:''});
                }}>Clear Filters</Button>
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'block' } }}></Grid> 
            
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Category" value={filterCategory} onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterType('All'); 
                }}>
                    <MenuItem value="All">All Categories</MenuItem>
                    {categories.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Error Type" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <MenuItem value="All">All Types</MenuItem>
                    {availableTypes.map((t) => <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>)}
                </TextField>
            </Grid>

            <Grid item xs={6} md={2}>
                <TextField type="date" fullWidth size="small" label="From" InputLabelProps={{ shrink: true }} value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
            </Grid>
            <Grid item xs={6} md={2}>
                <TextField type="date" fullWidth size="small" label="To" InputLabelProps={{ shrink: true }} value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
            </Grid>

             <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
                <Button size="small" color="error" onClick={() => {
                    setFilterBranch('All'); setFilterUser('All'); setFilterRaisedBy('All'); 
                    setFilterStatus('All'); setFilterCategory('All'); setFilterType('All');
                    setDateRange({start:'', end:''});
                }}>Clear</Button>
            </Grid>
        </Grid>
      </Paper>

      {/* TABLE */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#eeeeee' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Ticket #</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Issue</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Raised By</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fixed By</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTickets.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>No records match your filters.</TableCell></TableRow>
            ) : (
                filteredTickets.map((t) => {
                    const userColors = userColorMap[t.completedByUsername] || { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };

                    return (
                        <TableRow 
                            key={t.id} 
                            hover 
                            onClick={() => setSelectedTicket(t)} 
                            sx={{ cursor: 'pointer', transition: '0.2s' }}          
                        >
                            <TableCell sx={{ color: '#1976d2', fontWeight: 'bold' }}>{t.ticketNumber}</TableCell>
                            <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{t.branchName}</TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight="500">{t.errorType}</Typography>
                                <Typography variant="caption" color="text.secondary">{t.errorCategory}</Typography>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon fontSize="small" color="action" />
                                    {t.raisedByUsername}
                                </Box>
                            </TableCell>

                            <TableCell>
                                {t.completedByUsername ? (
                                    <Chip 
                                        icon={<BuildIcon sx={{ fontSize: '14px !important', color: `${userColors.text} !important` }} />} 
                                        label={t.completedByUsername} 
                                        size="small" 
                                        sx={{ 
                                            borderRadius: 1, 
                                            fontWeight: 'bold',
                                            bgcolor: userColors.bg, 
                                            color: userColors.text,   
                                            border: `1px solid ${userColors.border}`
                                        }}
                                    />
                                ) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>Pending</Typography>
                                )}
                            </TableCell>

                            <TableCell>
                                <Chip 
                                    label={t.status.replace('_', ' ')} 
                                    color={getStatusColor(t.status)} 
                                    size="small"
                                    variant="filled"
                                    sx={{ fontWeight: 'bold', minWidth: 90 }}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DETAIL POPUP */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">Ticket Details</Typography>
                    <Typography variant="caption" color="text.secondary">{selectedTicket.ticketNumber}</Typography>
                </Box>
                <IconButton onClick={() => setSelectedTicket(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Branch</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTicket.branchName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Current Status</Typography>
                        <Chip label={selectedTicket.status.replace('_', ' ')} color={getStatusColor(selectedTicket.status)} size="small" />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Issue Details</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedTicket.errorCategory} &gt; {selectedTicket.errorType}</Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Description</Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                            <Typography variant="body2">{selectedTicket.description}</Typography>
                        </Paper>
                    </Grid>

                    {selectedTicket.completedByUsername && (
                        <Grid item xs={12}>
                             <Alert severity="success" icon={<AccountCircleIcon />}>
                                Resolved by: <strong>{selectedTicket.completedByUsername}</strong>
                             </Alert>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setSelectedTicket(null)} variant="outlined">Close</Button>
            </DialogActions>
        </Dialog>
      )}

    </Container>
  );
}