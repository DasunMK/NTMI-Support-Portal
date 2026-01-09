import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Drawer, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Badge } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import TicketService from '../services/ticket.service';
import AuthService from '../services/auth.service';
import Header from './Header'; 

// Import Icons... (Keep your existing imports)
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings'; 
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail'; 
import HistoryIcon from '@mui/icons-material/History'; 
import AssessmentIcon from '@mui/icons-material/Assessment';

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const user = AuthService.getCurrentUser(); 

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await TicketService.getNotifications(user.username);
        setNotifications(res.data);
      } catch (error) { console.error("Poll error", error); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user.username]);

  // ... (Keep your existing drawerContent / renderNavItem logic) ...
  // Make sure you define 'renderNavItem' and 'drawerContent' here just like before.

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header onMenuClick={handleDrawerToggle} notifications={notifications} setNotifications={setNotifications} />
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} 
            sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {/* Render drawerContent here */}
        </Drawer>
        <Drawer variant="permanent" open 
            sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {/* Render drawerContent here */}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}