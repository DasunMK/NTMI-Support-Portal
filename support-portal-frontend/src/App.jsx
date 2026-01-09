import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminWorkHistory from "./pages/AdminWorkHistory"; // <--- Ensure this is imported
import BranchDashboard from "./pages/BranchDashboard";
import CreateTicket from "./pages/CreateTicket";
import TicketList from "./pages/TicketList";
import Layout from "./components/Layout";
import ManageUsers from "./pages/ManageUsers";
import AdminSettings from './pages/AdminSettings';
import Reports from './pages/Reports'; // <--- NEW IMPORT
import Inbox from "./pages/Inbox"; 
import PrivateRoute from "./components/PrivateRoute"; 
import AuthService from "./services/auth.service"; 

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Login />} /> 

        {/* PROTECTED ROUTES */}
        <Route element={<Layout />}>
            
            {/* --- ADMIN ROUTES --- */}
            <Route path="/admin-dashboard" element={
                <PrivateRoute allowedRoles={["ROLE_ADMIN"]}> 
                   <AdminDashboard /> 
                </PrivateRoute>
            } />
            
            <Route path="/users" element={
                <PrivateRoute allowedRoles={["ROLE_ADMIN"]}> 
                   <ManageUsers /> 
                </PrivateRoute>
            } />
            
            <Route path="/admin/settings" element={
                <PrivateRoute allowedRoles={["ROLE_ADMIN"]}> 
                   <AdminSettings /> 
                </PrivateRoute>
            } />

            <Route path="/admin/my-work" element={
                <PrivateRoute allowedRoles={["ROLE_ADMIN"]}> 
                   <AdminWorkHistory /> 
                </PrivateRoute>
            } />

            {/* NEW REPORT ROUTE */}
            <Route path="/reports" element={
                <PrivateRoute allowedRoles={["ROLE_ADMIN"]}> 
                   <Reports /> 
                </PrivateRoute>
            } />

            {/* --- BRANCH USER ROUTES --- */}
            <Route path="/branch-dashboard" element={
                <PrivateRoute allowedRoles={["ROLE_BRANCH_USER"]}> 
                   <BranchDashboard /> 
                </PrivateRoute>
            } />
            
            <Route path="/create-ticket" element={
                <PrivateRoute allowedRoles={["ROLE_BRANCH_USER"]}> 
                   <CreateTicket /> 
                </PrivateRoute>
            } />

            {/* --- SHARED ROUTES --- */}
            <Route path="/my-tickets" element={
                <PrivateRoute allowedRoles={["ROLE_ADMIN", "ROLE_BRANCH_USER"]}> 
                   <TicketList /> 
                </PrivateRoute>
            } />
            
            <Route path="/inbox" element={
                <PrivateRoute allowedRoles={["ROLE_ADMIN", "ROLE_BRANCH_USER"]}> 
                   <Inbox /> 
                </PrivateRoute>
            } />

            {/* AUTO-REDIRECT '/dashboard' */}
            <Route path="/dashboard" element={
                <PrivateRoute>
                   {AuthService.getCurrentUser()?.roles.includes("ROLE_ADMIN") 
                      ? <Navigate to="/admin-dashboard" replace /> 
                      : <Navigate to="/branch-dashboard" replace />
                   }
                </PrivateRoute>
            } />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;