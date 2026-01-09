import React, { useState } from 'react';
import { 
  AppBar, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Box, Avatar 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';
import TicketService from '../services/ticket.service';

export default function Header({ onMenuClick, notifications = [], setNotifications }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotifMenu = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
    window.location.reload();
  };

  // Safe Notification Handler
  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => !n.read).length 
    : 0;

  const handleMarkRead = async (id) => {
    try {
        await TicketService.markNotificationRead(id);
        // Update UI locally
        if (Array.isArray(notifications) && setNotifications) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    } catch (e) {
        console.error("Error marking read", e);
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          NTMI Support Portal
        </Typography>

        {/* NOTIFICATIONS */}
        <IconButton color="inherit" onClick={handleNotifMenu}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* USER PROFILE */}
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                {user ? user.username : 'User'}
            </Typography>
            <IconButton onClick={handleMenu} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user ? user.username.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            </IconButton>
        </Box>

        {/* PROFILE MENU */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogout}>
            <ListItemIconWrapper><LogoutIcon fontSize="small" /></ListItemIconWrapper> 
            Logout
          </MenuItem>
        </Menu>

        {/* NOTIFICATION MENU */}
        <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
        >
            {Array.isArray(notifications) && notifications.length > 0 ? (
                notifications.map((notif) => (
                    <MenuItem 
                        key={notif.id} 
                        onClick={() => handleMarkRead(notif.id)}
                        sx={{ 
                            bgcolor: notif.read ? 'inherit' : 'action.hover',
                            whiteSpace: 'normal', 
                            fontSize: '0.875rem',
                            borderBottom: '1px solid #eee'
                        }}
                    >
                        {notif.message}
                    </MenuItem>
                ))
            ) : (
                <MenuItem onClick={handleNotifClose}>No new notifications</MenuItem>
            )}
        </Menu>

      </Toolbar>
    </AppBar>
  );
}

// Helper to prevent crash if ListItemIcon is not imported
const ListItemIconWrapper = ({children}) => <Box component="span" mr={1} display="flex">{children}</Box>;