import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store } from './store';
import theme from './theme';

// Layout
import Layout from './components/layout/Layout';

// Auth
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PrivateRoute from './components/auth/PrivateRoute';
import PasswordReset from './components/auth/PasswordReset';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Kitchen
import MenuItems from './components/kitchen/MenuItems';
import MenuItemForm from './components/kitchen/MenuItemForm';
import Inventory from './components/kitchen/Inventory';
import KitchenDisplay from './components/kitchen/KitchenDisplay';

// Orders
import Orders from './components/orders/Orders';
import OrderDetails from './components/orders/OrderDetails';
import NewOrder from './components/orders/NewOrder';

// Tables
import Tables from './components/tables/Tables';
import Reservations from './components/tables/Reservations';
import ReservationForm from './components/tables/ReservationForm';

// Users
import Users from './components/users/Users';

// Audit Logs
import AuditLogs from './components/audit/AuditLogs';

// Inventory
import InventoryDashboard from './components/inventory/InventoryDashboard';

// Import WebSocket test
import { testWebSocketConnection } from './services/websocket-test';

function WebSocketTestWrapper() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔌 Running WebSocket Connection Test');
      const testResults = testWebSocketConnection();

      // Optional: Add cleanup if needed
      return () => {
        if (testResults) {
          testResults.orderUpdateUnsub();
          testResults.newOrderUnsub();
        }
      };
    }
  }, [isAuthenticated, user]);

  return null; // This component doesn't render anything
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          {/* WebSocket Test Component */}
          <WebSocketTestWrapper />
          
          <Router>
            <Routes>
              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* Protected Routes */}
                <Route
                  path="dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                
                {/* Kitchen Routes */}
                <Route
                  path="kitchen/menu-items"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'chef']}>
                      <MenuItems />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="kitchen/menu-items/new"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'chef']}>
                      <MenuItemForm />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="kitchen/inventory"
                  element={
                    <PrivateRoute roles={['admin', 'manager']}>
                      <Inventory />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="kitchen/display"
                  element={
                    <PrivateRoute roles={['chef', 'kitchen_staff']}>
                      <KitchenDisplay />
                    </PrivateRoute>
                  }
                />
                
                {/* Orders Routes */}
                <Route
                  path="orders"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'waiter']}>
                      <Orders />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="orders/new"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'waiter']}>
                      <NewOrder />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="orders/:id"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'waiter']}>
                      <OrderDetails />
                    </PrivateRoute>
                  }
                />
                
                {/* Tables Routes */}
                <Route
                  path="tables"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'waiter']}>
                      <Tables />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="tables/reservations"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'waiter']}>
                      <Reservations />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="tables/reservations/new"
                  element={
                    <PrivateRoute roles={['admin', 'manager', 'waiter']}>
                      <ReservationForm />
                    </PrivateRoute>
                  }
                />

                {/* Users Management */}
                <Route
                  path="users"
                  element={
                    <PrivateRoute roles={['admin']}>
                      <Users />
                    </PrivateRoute>
                  }
                />

                {/* Audit Logs */}
                <Route
                  path="audit-logs"
                  element={
                    <PrivateRoute roles={['admin', 'manager']}>
                      <AuditLogs />
                    </PrivateRoute>
                  }
                />
                
                {/* Inventory Routes */}
                <Route 
                  path="/inventory" 
                  element={
                    <PrivateRoute roles={['admin', 'manager']}>
                      <InventoryDashboard />
                    </PrivateRoute>
                  } 
                />
              </Route>
              
              {/* Redirect to login for unknown routes */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
          
          {/* Toast Notifications Container */}
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
