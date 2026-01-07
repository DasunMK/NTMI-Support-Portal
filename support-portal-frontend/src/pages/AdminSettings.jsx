import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Paper, Grid, List, ListItem, 
  ListItemText, IconButton, TextField, Button, Box, 
  Chip, Snackbar, Alert 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../api/axiosConfig';

export default function AdminSettings() {
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);

  const [newBranch, setNewBranch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newType, setNewType] = useState({ name: '', categoryId: '' });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // --- DATA LOADING ---
  const fetchData = async () => {
    try {
      const [bRes, cRes, tRes] = await Promise.all([
        api.get('/api/v1/settings/branches'),
        api.get('/api/v1/settings/categories'),
        api.get('/api/v1/settings/types')
      ]);
      setBranches(bRes.data);
      setCategories(cRes.data);
      setTypes(tRes.data);
    } catch (e) { 
        console.error("Load failed", e); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- SNACKBAR HELPERS ---
  const showMessage = (message, severity = 'success') => {
      setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
      setSnackbar({ ...snackbar, open: false });
  };

  // --- ACTIONS ---

  const addBranch = async () => {
    if(!newBranch) return;
    try {
        await api.post('/api/v1/settings/branches', { name: newBranch });
        setNewBranch(''); 
        fetchData();
        showMessage("Branch added successfully!");
    } catch (error) {
        showMessage("Failed to add branch. It may already exist.", "error");
    }
  };

  const addCategory = async () => {
    if(!newCategory) return;
    try {
        await api.post('/api/v1/settings/categories', { name: newCategory });
        setNewCategory(''); 
        fetchData();
        showMessage("Category added successfully!");
    } catch (error) {
        showMessage("Failed to add category.", "error");
    }
  };

  const addType = async () => {
    if(!newType.name || !newType.categoryId) {
        showMessage("Please select a category and enter a name", "warning");
        return;
    }

    try {
        await api.post('/api/v1/settings/types', {
            name: newType.name,
            categoryId: parseInt(newType.categoryId)
        });

        setNewType({ ...newType, name: '' }); 
        fetchData();
        showMessage("Error Type added successfully!");
    } catch (error) {
        showMessage("Failed to add Error Type.", "error");
    }
  };

  const deleteItem = async (endpoint, id) => {
    if(!window.confirm("Are you sure you want to delete this item?")) return;
    try {
        await api.delete(`/api/v1/settings/${endpoint}/${id}`);
        fetchData();
        showMessage("Item deleted successfully!");
    } catch (error) {
        if(endpoint === 'categories') {
            showMessage("Cannot delete Category! Delete its Error Types first.", "error");
        } else if (endpoint === 'branches') {
            showMessage("Cannot delete Branch! Users are assigned to it.", "error");
        } else {
            showMessage("Failed to delete item.", "error");
        }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom>System Settings</Typography>
      
      {/* SUCCESS/ERROR POPUP */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        
        {/* BRANCHES */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Branches</Typography>
            <Box display="flex" gap={1} mb={2}>
              <TextField size="small" label="New Branch" value={newBranch} onChange={e=>setNewBranch(e.target.value)} fullWidth/>
              <Button variant="contained" onClick={addBranch}><AddIcon/></Button>
            </Box>
            <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {branches.map(b => (
                <ListItem key={b.id} divider secondaryAction={<IconButton edge="end" onClick={()=>deleteItem('branches', b.id)}><DeleteIcon color="error" fontSize="small"/></IconButton>}>
                  <ListItemText primary={b.name}/>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* CATEGORIES */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Categories</Typography>
            <Box display="flex" gap={1} mb={2}>
              <TextField size="small" label="New Category" value={newCategory} onChange={e=>setNewCategory(e.target.value)} fullWidth/>
              <Button variant="contained" onClick={addCategory}><AddIcon/></Button>
            </Box>
            <List dense sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {categories.map(c => (
                <ListItem key={c.id} divider secondaryAction={<IconButton edge="end" onClick={()=>deleteItem('categories', c.id)}><DeleteIcon color="error" fontSize="small"/></IconButton>}>
                  <ListItemText primary={c.name}/>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

         {/* ERROR TYPES*/}
         <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Error Types</Typography>
            
            <Box display="flex" flexDirection="column" gap={1} mb={2} sx={{ bgcolor: '#f9f9f9', p: 1, borderRadius: 1 }}>
              <TextField 
                select 
                SelectProps={{ native: true }} 
                size="small" 
                label="Filter / Add by Category"
                value={newType.categoryId} 
                onChange={e=>setNewType({...newType, categoryId: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              >
                <option value="">-- Select Category --</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </TextField>
              
              <Box display="flex" gap={1}>
                <TextField size="small" placeholder="New Type Name" value={newType.name} onChange={e=>setNewType({...newType, name: e.target.value})} fullWidth/>
                <Button variant="contained" onClick={addType} disabled={!newType.categoryId}><AddIcon/></Button>
              </Box>
            </Box>

            <List dense sx={{ maxHeight: 330, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {types
                .filter(t => {
                    if (!newType.categoryId) return true;
                    // Handle complex object or flat ID
                    const tCatId = (typeof t.category === 'object') ? t.category.id : t.categoryId;
                    return String(tCatId) === String(newType.categoryId);
                })
                .map(t => (
                  <ListItem key={t.id} divider secondaryAction={<IconButton edge="end" onClick={()=>deleteItem('types', t.id)}><DeleteIcon color="error" fontSize="small"/></IconButton>}>
                    <ListItemText 
                        primary={t.name} 
                        // FIX: "component={'div'}" prevents the HTML nesting error
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={!newType.categoryId && <Chip label={t.category?.name || 'Unknown'} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />}
                    />
                  </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}