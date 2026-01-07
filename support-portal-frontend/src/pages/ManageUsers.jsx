import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Backdrop, CircularProgress, Snackbar, Alert, Chip 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../api/axiosConfig';

// Validations
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]); 

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [loading, setLoading] = useState(false); 
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' }); 

  // Updated state to match your DB Schema
  const [currentUser, setCurrentUser] = useState({
    id: '', 
    username: '', 
    password: '', 
    role: 'BRANCH_USER', 
    branchId: '', 
    fullName: '',  
    email: ''     
  });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  // --- API CALLS (FIXED URLS) ---
  const fetchUsers = async () => {
    setLoading(true); 
    try {
      // FIX: Added /api/v1 prefix
      const res = await api.get('/api/v1/users/all');
      setUsers(res.data);
    } catch (error) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false); 
    }
  };

  const fetchBranches = async () => {
    try {
      // FIX: Added /api/v1 prefix
      const res = await api.get('/api/v1/branches/all'); 
      setBranches(res.data);
    } catch (error) {
      console.error("Failed to load branches");
    }
  };

  useEffect(() => { 
      fetchUsers(); 
      fetchBranches(); 
  }, []);

  // --- HANDLERS ---
  const handleOpenAdd = () => {
    setEditMode(false);
    setCurrentUser({ 
        id: '', username: '', password: '', role: 'BRANCH_USER', branchId: '', 
        fullName: '', email: '' 
    });
    setOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditMode(true);
    // FIX: Handle nested branch object from backend (user.branch.id)
    const bId = user.branch ? user.branch.id : (user.branchId || '');

    setCurrentUser({
        id: user.id,
        username: user.username,
        password: '', 
        role: user.role,
        branchId: bId, 
        fullName: user.fullName,
        email: user.email
    });
    setOpen(true);
  };

  const handleSave = async () => {
    // 1. Validation
    if (!currentUser.username || (!editMode && !currentUser.password) || !currentUser.fullName) {
      showToast("Please fill in required fields (Name, Username, Password)", "error");
      return;
    }
    if (currentUser.email && !emailRegex.test(currentUser.email)) {
      showToast("Invalid Email Address", "error");
      return;
    }
    if (currentUser.role === 'BRANCH_USER' && !currentUser.branchId) {
        showToast("Branch Users must be assigned to a Branch", "error");
        return;
    }

    setLoading(true); 
    try {
      if (editMode) {
        // FIX: Added /api/v1 prefix
        await api.put(`/api/v1/users/update/${currentUser.id}`, currentUser);
        showToast("User updated successfully!", "success");
      } else {
        // FIX: Added /api/v1 prefix
        const { id, ...userToSend } = currentUser; 
        await api.post('/api/v1/auth/signup', userToSend); 
        showToast("User created successfully!", "success");
      }
      setOpen(false);
      fetchUsers(); 
    } catch (error) {
      console.error("Save failed:", error);
      showToast(error.response?.data?.message || "Error saving user.", "error");
    } finally {
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoading(true);
      try {
        // FIX: Added /api/v1 prefix
        await api.delete(`/api/v1/users/delete/${id}`);
        showToast("User deleted successfully", "success");
        fetchUsers();
      } catch (error) {
        showToast("Failed to delete user", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper to find branch name from ID for display in table
  const getBranchName = (id) => {
    if (!id) return '-';
    const branch = branches.find(b => b.id === id);
    return branch ? branch.name : '-';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      
      {/* Loading & Toast */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar 
        open={toast.open} autoHideDuration={6000} onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Typography variant="h4" color="primary" fontWeight="bold">User Management</Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenAdd}>
          Add New User
        </Button>
      </div>

      {/* Users Table */}
      <Paper elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Full Name</strong></TableCell>
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Branch</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                    {user.role === 'ADMIN' ? 
                        <Chip label="Admin" color="secondary" size="small" /> : 
                        <Chip label="Branch User" color="primary" size="small" variant="outlined" />
                    }
                </TableCell>
                {/* FIX: Handle nested branch object (user.branch?.id) */}
                <TableCell>{getBranchName(user.branch ? user.branch.id : user.branchId)}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenEdit(user)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(user.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} align="center">No users found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
            {editMode ? "Edit User Details" : "Create New User"}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>Login Credentials</Typography>
          <div style={{ display: 'flex', gap: 10 }}>
             <TextField required label="Username" fullWidth size="small" 
                value={currentUser.username} onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})} 
                disabled={editMode} 
             />
             <TextField required={!editMode} label={editMode ? "New Password (Optional)" : "Password"} type="password" fullWidth size="small" 
                value={currentUser.password} onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})} 
             />
          </div>

          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>Personal Info</Typography>
          <TextField required label="Full Name" fullWidth size="small" 
            value={currentUser.fullName} onChange={(e) => setCurrentUser({...currentUser, fullName: e.target.value})} 
          />
          <TextField label="Email Address" fullWidth size="small" 
             value={currentUser.email} onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})} 
          />

          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>System Access</Typography>
          <div style={{ display: 'flex', gap: 10 }}>
            <TextField select label="Role" fullWidth size="small" 
                value={currentUser.role} onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
            >
                <MenuItem value="BRANCH_USER">Branch User</MenuItem>
                <MenuItem value="ADMIN">Admin (Head Office)</MenuItem>
            </TextField>
            
            <TextField select label="Assign Branch" fullWidth size="small" 
                value={currentUser.branchId} 
                onChange={(e) => setCurrentUser({...currentUser, branchId: e.target.value})}
                disabled={currentUser.role === 'ADMIN'}
            >
                {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
            </TextField>
          </div>

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : editMode ? "Update User" : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}