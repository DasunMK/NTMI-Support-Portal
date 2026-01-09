import React, { useState, useEffect } from 'react';
import { 
  Box, CssBaseline, Drawer, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Badge 
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import TicketService from '../services/ticket.service'; // Ensure getNotifications is in here
import AuthService from '../services/auth.service';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings'; 
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail'; 
import HistoryIcon from '@mui/icons-material/History'; 
import AssessmentIcon from '@mui/icons-material/Assessment';

import Header from './Header'; 

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]); 
  
  const navigate = useNavigate();
  const location = useLocation(); 
  const user = AuthService.getCurrentUser(); 

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // --- UPDATED: Poll Real Backend Notification API ---
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        console.log(`Polling notifications for: ${user.username}`); // <--- DEBUG LOG 1
        const res = await TicketService.getNotifications(user.username);
        
        console.log("Notification Data Received:", res.data); // <--- DEBUG LOG 2
        setNotifications(res.data);
      
      } catch (error) {
        console.error("Notification polling error:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user.username]);

  const isActive = (path) => location.pathname === path;

  const renderNavItem = (text, icon, path, badgeCount = 0) => (
    <ListItem key={text} disablePadding>
      <ListItemButton 
        onClick={() => navigate(path)}
        sx={{ 
          bgcolor: isActive(path) ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
          '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
          borderRight: isActive(path) ? '4px solid #1976d2' : 'none'
        }}
      >
        <ListItemIcon sx={{ color: isActive(path) ? "#1976d2" : "inherit" }}>
          {badgeCount > 0 ? (
            <Badge badgeContent={badgeCount} color="error">
              {icon}
            </Badge>
          ) : (
            icon
          )}
        </ListItemIcon>
        <ListItemText 
          primary={text} 
          primaryTypographyProps={{ 
            fontWeight: isActive(path) ? 'bold' : 'normal',
            color: isActive(path) ? "#1976d2" : "inherit" 
          }} 
        />
      </ListItemButton>
    </ListItem>
  );

  const isAdmin = user?.roles.includes("ROLE_ADMIN");

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {isAdmin ? (
          <>
            {renderNavItem("Dashboard", <DashboardIcon />, '/admin-dashboard')}
            {renderNavItem("My Work History", <HistoryIcon />, '/admin/my-work')}
            
            {/* Show Notification Count on Inbox */}
            {renderNavItem("Inbox (New)", <MailIcon />, '/inbox', notifications.length)}
            
            {renderNavItem("Reports", <AssessmentIcon />, '/reports')}
            {renderNavItem("Users", <GroupIcon />, '/users')}
            {renderNavItem("Admin Settings", <SettingsIcon />, '/admin/settings')} 
          </>
        ) : (
          <>
            {renderNavItem("Dashboard", <DashboardIcon />, '/branch-dashboard')}
            {renderNavItem("Raise Ticket", <AddCircleIcon />, '/create-ticket')}
            {renderNavItem("My History", <HistoryIcon />, '/my-tickets')}
          </>
        )}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* Pass the real notifications to the Header */}
      <Header 
        onMenuClick={handleDrawerToggle} 
        notifications={notifications} 
        setNotifications={setNotifications}
      />
      
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer 
            variant="temporary" 
            open={mobileOpen} 
            onClose={handleDrawerToggle} 
            ModalProps={{ keepMounted: true }} 
            sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer 
            variant="permanent" 
            sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} 
            open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}