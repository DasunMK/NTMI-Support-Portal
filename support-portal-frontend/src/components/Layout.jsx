import React, { useState, useEffect } from 'react';
import { 
  Box, CssBaseline, Drawer, Toolbar, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Divider, Badge 
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import TicketService from '../services/ticket.service'; 
import AuthService from '../services/auth.service';
import Header from './Header'; 

// Icons
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // --- NOTIFICATION POLLING ---
  useEffect(() => {
    // 1. Safety Check: If no user, stop immediately
    if (!user || !user.username) return;

    const fetchNotifications = async () => {
      try {
        const res = await TicketService.getNotifications(user.username);
        setNotifications(res.data);
      } catch (error) {
        console.error("Poll error", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
    
    // 2. CRITICAL FIX: Use optional chaining (?.) to prevent crash on logout
  }, [user?.username]);

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

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {isAdmin ? (
          <>
            {renderNavItem("Dashboard", <DashboardIcon />, '/admin-dashboard')}
            {renderNavItem("My Work", <HistoryIcon />, '/admin/my-work')}
            {renderNavItem("Inbox", <MailIcon />, '/inbox', notifications.length)}
            {renderNavItem("Reports", <AssessmentIcon />, '/reports')}
            {renderNavItem("Users", <GroupIcon />, '/users')}
            {renderNavItem("Settings", <SettingsIcon />, '/admin/settings')} 
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
      
      {/* HEADER with Notifications */}
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