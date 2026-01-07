import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, CssBaseline, Drawer, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Badge 
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import TicketService from '../services/ticket.service';
import AuthService from '../services/auth.service';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings'; // <--- IMPORTED
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail'; 
import HistoryIcon from '@mui/icons-material/History'; 
import AssessmentIcon from '@mui/icons-material/Assessment';

import Header from './Header'; 

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // NOTIFICATION STATE 
  const [notifications, setNotifications] = useState([]); 
  const [ticketCount, setTicketCount] = useState(0); 
  
  const prevTicketStatuses = useRef({}); 
  const prevPendingIds = useRef([]);     
  const isFirstLoad = useRef(true);      

  const navigate = useNavigate();
  const location = useLocation(); 
  const user = AuthService.getCurrentUser(); 

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    if (!user) return;

    const checkTickets = async () => {
      try {
        const res = await TicketService.getAllTickets(); 
        const allTickets = res.data;
        const isAdmin = user.roles.includes("ROLE_ADMIN"); 

        if (isAdmin) {
             const pendingTickets = allTickets.filter(ticket => ticket.status === 'PENDING');
             const currentCount = pendingTickets.length;

             if (!isFirstLoad.current) {
                 pendingTickets.forEach(t => {
                     if (!prevPendingIds.current.includes(t.id)) {
                         const newMsg = {
                             id: Date.now() + Math.random(),
                             title: "New Ticket Received",
                             detail: `Branch: ${t.branchName} | Issue: ${t.description}`,
                             time: new Date(),
                             type: 'warning',
                             read: false 
                         };
                         setNotifications(prev => [newMsg, ...prev]);
                     }
                 });
             }
             prevPendingIds.current = pendingTickets.map(t => t.id);
             setTicketCount(currentCount);
        }

        if (!isAdmin) { // Branch User
            // Simplified filter logic
            const myTickets = allTickets.filter(t => t.branchName === user.username); 
            setTicketCount(myTickets.filter(t => t.status === 'IN_PROGRESS').length);

            myTickets.forEach(t => {
                const oldStatus = prevTicketStatuses.current[t.id];
                const newStatus = t.status;

                if (!isFirstLoad.current && oldStatus && oldStatus !== newStatus) {
                    if (oldStatus === 'PENDING' && newStatus === 'IN_PROGRESS') {
                        setNotifications(prev => [{ title: `Ticket #${t.id} Started`, type: 'info' }, ...prev]);
                    }
                    if (newStatus === 'COMPLETED') {
                        setNotifications(prev => [{ title: `Ticket #${t.id} Fixed`, type: 'success' }, ...prev]);
                    }
                }
                prevTicketStatuses.current[t.id] = newStatus;
            });
        }
        isFirstLoad.current = false; 

      } catch (error) {
        console.error("Polling failed", error);
      }
    };

    checkTickets();
    const interval = setInterval(checkTickets, 5000); 
    
    return () => clearInterval(interval);
  }, []);

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
            {renderNavItem("Inbox (New)", <MailIcon />, '/inbox', ticketCount)}
            {renderNavItem("Reports", <AssessmentIcon />, '/reports')}
            {renderNavItem("Users", <GroupIcon />, '/users')}
            {/* ADDED: Admin Settings Link */}
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
      <Header onMenuClick={handleDrawerToggle} notifications={notifications} />
      
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