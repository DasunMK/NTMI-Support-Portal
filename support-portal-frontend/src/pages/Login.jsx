import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { Container, Box, TextField, Button, Typography, Paper, Alert, InputAdornment } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Avatar from '@mui/material/Avatar';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const user = await AuthService.login(username, password);
    
    // --- FIX: CHECK ROLE AND NAVIGATE CORRECTLY ---
    if (user.roles.includes("ROLE_ADMIN")) {
        navigate("/admin-dashboard");
    } else {
        navigate("/branch-dashboard");
    }
    // ----------------------------------------------
    
  } catch (error) {
    // ... error handling ...
  }
};

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', // Corporate Blue Gradient
        padding: 2
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={10} 
          sx={{ 
            padding: 5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)' // Slightly transparent white
          }}
        >
          
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', color: '#1565c0', mt: 1 }}>
            NTMI Support Portal
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please sign in to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 4, mb: 2, py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
            >
              Sign In
            </Button>

            <Typography variant="caption" display="block" align="center" color="text.secondary">
              © 2026 NTMI IT Department
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;