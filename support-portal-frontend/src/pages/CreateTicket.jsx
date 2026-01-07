import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Typography, Paper, MenuItem, Box, Container, 
  Backdrop, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/axiosConfig';
import AuthService from '../services/auth.service';

export default function CreateTicket() {
  const currentUser = AuthService.getCurrentUser(); 

  // --- FORM STATE ---
  const [branchId, setBranchId] = useState('');
  const [errorCategory, setErrorCategory] = useState('');
  const [errorTypeId, setErrorTypeId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); 

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' }); 
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState(null);

  // --- DATA OPTIONS ---
  const [settings, setSettings] = useState({ 
    branches: [], 
    categories: [], 
    types: [] 
  });

  const [filteredTypes, setFilteredTypes] = useState([]);

  // SOUND
  const playSendSound = () => {
    const audio = new Audio('/sent.mp3'); 
    audio.play().catch(e => console.log("Audio play failed"));
  };

  // 1. FETCH OPTIONS ON LOAD
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [bRes, cRes, tRes] = await Promise.all([
          api.get('/api/v1/settings/branches'),
          api.get('/api/v1/settings/categories'),
          api.get('/api/v1/settings/types')
        ]);

        setSettings({
          branches: bRes.data || [],
          categories: cRes.data || [],
          types: tRes.data || []
        });

        // Pre-select User's Branch if available
        if (currentUser?.branchId) {
            setBranchId(currentUser.branchId);
        }

      } catch (error) {
        console.error("API Error:", error);
        setToast({ open: true, message: 'Failed to load options.', severity: 'error' });
      }
    };
    fetchSettings();
  }, [currentUser]);

  // 2. ROBUST HANDLE CATEGORY CHANGE
  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setErrorCategory(selectedCatId);
    
    const relevantTypes = settings.types.filter(t => {
        // Handle both object nesting (t.category.id) and flat ID (t.categoryId)
        const typeCatId = t.categoryId || t.category?.id;
        return String(typeCatId) === String(selectedCatId);
    });

    setFilteredTypes(relevantTypes);
    setErrorTypeId(''); // Reset Type selection
  };

  // 3. HANDLE IMAGE SELECT (MAX 3)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      setToast({ open: true, message: 'Maximum 3 images allowed.', severity: 'warning' });
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 4. SUBMIT FORM (MULTIPART)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('branchId', branchId);
    formData.append('errorTypeId', errorTypeId);
    formData.append('priority', priority);
    formData.append('description', description);
    
    // FIX: Send User ID so ticket is linked to creator
    if (currentUser && currentUser.id) {
        formData.append('userId', currentUser.id);
    }
    
    // Add images
    images.forEach((img) => {
        formData.append('images', img);
    });

    try {
      const response = await api.post('/api/v1/tickets', formData);
      
      playSendSound();
      setCreatedTicketId(response.data.ticketNumber || "SUBMITTED");
      setSuccessOpen(true); 
      
      // Reset Form
      setImages([]);
      setDescription('');
      setErrorTypeId('');
      setPriority('MEDIUM');
      // Keep branch/category for convenience
      
    } catch (error) {
      console.error("Submit Error:", error);
      setToast({ open: true, message: 'Failed to submit ticket.', severity: 'error' });
    } finally {
      setLoading(false); 
    }
  };

  return (
    <Container maxWidth="sm">
     
      {/* LOADING SPINNER */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* TOAST NOTIFICATION */}
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert onClose={() => setToast({...toast, open: false})} severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      {/* SUCCESS DIALOG */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'green' }}>
            <CheckCircleIcon /> Ticket Raised!
        </DialogTitle>
        <DialogContent>
            <DialogContentText>
              Your ticket has been successfully submitted.
              <br /><br />
              Ticket No: <strong>{createdTicketId}</strong>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setSuccessOpen(false)} variant="contained" autoFocus>OK</Button>
        </DialogActions>
      </Dialog>

      {/* --- MAIN FORM PAPER --- */}
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom align="center" fontWeight="bold" color="primary">
          Raise New Ticket
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          
          {/* BRANCH SELECT */}
          <TextField 
            select 
            label="Branch" 
            value={branchId} 
            onChange={(e) => setBranchId(e.target.value)} 
            required
            fullWidth
          >
            {settings.branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
            ))}
          </TextField>

          {/* PRIORITY SELECT */}
          <TextField 
            select 
            label="Priority" 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)} 
            required
            fullWidth
          >
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
          </TextField>

          {/* CATEGORY SELECT */}
          <TextField 
            select 
            label="Error Category" 
            value={errorCategory} 
            onChange={handleCategoryChange} 
            required
            fullWidth
          >
            {settings.categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>

          {/* TYPE SELECT (Dependent) */}
          <TextField 
            select 
            label="Error Type" 
            value={errorTypeId} 
            onChange={(e) => setErrorTypeId(e.target.value)} 
            required 
            fullWidth
            disabled={!errorCategory} 
            helperText={!errorCategory ? "Please select a category first" : ""}
          >
             {filteredTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
             ))}
          </TextField>

          {/* DESCRIPTION */}
          <TextField 
            label="Description (Optional)" 
            multiline 
            rows={4} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Describe the issue in detail..." 
            fullWidth
          />

          {/* IMAGE UPLOAD */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="textSecondary">
                Attachments (Max 3)
            </Typography>
            <Button variant="outlined" component="label" startIcon={<PhotoCamera />} fullWidth sx={{ borderStyle: 'dashed' }}>
                Upload Images
                <input hidden accept="image/*" multiple type="file" onChange={handleImageChange} />
            </Button>
            
            {/* Image Previews */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {images.map((file, index) => (
                  <Paper key={index} elevation={2} sx={{ p: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ maxWidth: 100, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                         {file.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => removeImage(index)}
                        sx={{ ml: 1 }}
                      >
                         <DeleteIcon fontSize="small" />
                      </IconButton>
                  </Paper>
                ))}
            </Box>
          </Box>

          {/* SUBMIT BUTTON */}
          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            endIcon={<SendIcon />} 
            disabled={loading || !branchId || !errorTypeId}
            sx={{ py: 1.5, fontWeight: 'bold' }}
          >
            {loading ? "Sending..." : "Submit Ticket"}
          </Button>

        </Box>
      </Paper>
    </Container>
  );
}