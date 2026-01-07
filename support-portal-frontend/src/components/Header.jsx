import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Avatar, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useState } from 'react';
import AuthService from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick, notifications = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 2, display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          NTMI Support Portal
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Notification Icon */}
          <IconButton size="large" color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleMenu}>
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user?.username}
            </Typography>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <AccountCircle />
            </Avatar>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}