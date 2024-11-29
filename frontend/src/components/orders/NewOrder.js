import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress,
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import websocketService from '../../services/websocket';
import { apiService } from '../../services/apiService';

function NewOrder() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [order, setOrder] = useState({
    table_number: '',
    items: [],
    total_price: 0,
    priority: 'normal',
    special_instructions: '',
    estimated_preparation_time: 0
  });

  // Check user role
  useEffect(() => {
    console.log('Authentication state:', { isAuthenticated, user });

    if (!isAuthenticated) {
      console.log('User is not authenticated');
      toast.error('Please log in to create an order');
      navigate('/login');
      return;
    }

    if (!user) {
      console.log('User object is missing');
      toast.error('User information not found');
      navigate('/login');
      return;
    }

    if (!Array.isArray(user.roles)) {
      console.log('User roles is not an array:', user.roles);
      toast.error('Role information is invalid');
      navigate('/dashboard');
      return;
    }

    const allowedRoles = ['admin', 'manager', 'waiter'];
    const userRoles = user.roles.map(role => role.toLowerCase());
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));

    console.log('Role check:', {
      userRoles,
      allowedRoles,
      hasPermission
    });

    if (!hasPermission) {
      console.log('User lacks required permissions');
      toast.error('You do not have permission to create orders');
      navigate('/dashboard');
      return;
    }

    // If we reach here, user has permission
    console.log('User has permission to access NewOrder');
    
  }, [isAuthenticated, user, navigate]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch menu items from kitchen endpoint
      const menuItemsData = await apiService.get('/kitchen/menu-items/');
      
      // Fetch tables
      const tablesData = await apiService.get('/tables/');
      
      console.log('Fetched menu items:', menuItemsData);
      console.log('Fetched tables:', tablesData);
      
      // Process and set the data
      const categories = [...new Set(menuItemsData.map(item => item.category))];
      console.log('Extracted categories:', categories);
      
      setMenuItems(menuItemsData);
      setMenuCategories(categories);
      setTables(tablesData);
      setLoading(false);
      
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      let errorMessage = 'Failed to load required data';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Please log in to access this page';
            navigate('/login');
            break;
          case 403:
            errorMessage = 'You do not have permission to access this page';
            navigate('/dashboard');
            break;
          case 404:
            errorMessage = 'Required data not found';
            break;
          default:
            errorMessage = 'An error occurred while loading the page';
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  }, [navigate]);

  // Set up WebSocket subscription for menu updates
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('Setting up WebSocket subscriptions...');
    
    const unsubscribeMenuUpdates = websocketService.subscribe('kitchen_menu_updates', (data) => {
      console.log('Received menu update:', data);
      setMenuItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === data.id) {
            return { ...item, ...data };
          }
          return item;
        });
      });
    });

    return () => {
      console.log('Cleaning up WebSocket subscriptions...');
      unsubscribeMenuUpdates();
    };
  }, [isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, fetchInitialData]);

  const handleAddItem = (menuItem) => {
    const existingItemIndex = order.items.findIndex(item => item.id === menuItem.id);
    
    if (existingItemIndex > -1) {
      const updatedItems = [...order.items];
      updatedItems[existingItemIndex].quantity += 1;
      
      setOrder(prevOrder => ({
        ...prevOrder,
        items: updatedItems,
        total_price: Number(prevOrder.total_price) + Number(menuItem.price),
        estimated_preparation_time: calculateEstimatedTime(updatedItems)
      }));
    } else {
      const newItems = [...order.items, { ...menuItem, quantity: 1 }];
      setOrder(prevOrder => ({
        ...prevOrder,
        items: newItems,
        total_price: Number(prevOrder.total_price) + Number(menuItem.price),
        estimated_preparation_time: calculateEstimatedTime(newItems)
      }));
    }
  };

  const handleUpdateQuantity = (itemId, change) => {
    setOrder(prevOrder => {
      const updatedItems = prevOrder.items.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change);
          if (newQuantity === 0) {
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean);

      return {
        ...prevOrder,
        items: updatedItems,
        total_price: Number(updatedItems.reduce((sum, item) => Number(sum) + (Number(item.price) * Number(item.quantity)), 0)),
        estimated_preparation_time: calculateEstimatedTime(updatedItems)
      };
    });
  };

  const calculateEstimatedTime = (items) => {
    // Base time of 5 minutes
    let baseTime = 5;
    
    // Add preparation time for each item
    const itemsTime = items.reduce((total, item) => {
      // Assume each item takes 3-5 minutes based on quantity
      return total + (Math.ceil(item.quantity / 2) * 3);
    }, 0);

    return baseTime + itemsTime;
  };

  const handleTableSelect = (tableNumber) => {
    console.log('Selected table:', tableNumber);
    console.log('Available tables:', tables);
    
    // Validate table selection
    const selectedTable = tables.find(table => table.number === tableNumber);
    
    if (!selectedTable) {
      console.error('Invalid table selection:', tableNumber);
      toast.error(`Table ${tableNumber} is not available`);
      return;
    }

    // Check table availability
    if (selectedTable.is_occupied) {
      console.warn('Selected table is occupied:', tableNumber);
      toast.warning(`Table ${tableNumber} is currently occupied`);
      return;
    }

    setOrder(prevOrder => ({
      ...prevOrder,
      table_number: tableNumber
    }));
  };

  const canSubmitOrder = () => {
    const hasItems = order.items.length > 0;
    const hasTable = !!order.table_number;
    
    console.log('Order submission check:', {
      hasItems,
      hasTable,
      tableNumber: order.table_number,
      items: order.items
    });

    return hasItems && hasTable;
  };

  const renderTableSelection = () => {
    console.log('Rendering table selection. Available tables:', tables);
    
    if (loading) {
      return <CircularProgress />;
    }

    if (error) {
      return (
        <Typography color="error">
          {error}
        </Typography>
      );
    }

    if (!tables || tables.length === 0) {
      console.warn('No tables available');
      return (
        <Typography color="warning">
          No tables are currently available
        </Typography>
      );
    }

    return (
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Table</InputLabel>
        <Select
          value={order.table_number}
          label="Select Table"
          onChange={(e) => {
            const selectedTable = tables.find(table => table.table_number === e.target.value);
            console.log('Selected table:', selectedTable);
            
            // Only set table if it's available
            if (selectedTable && selectedTable.status === 'available') {
              setOrder(prev => ({ 
                ...prev, 
                table_number: e.target.value 
              }));
            } else {
              toast.warning(`Table ${e.target.value} is not available`);
            }
          }}
          disabled={tables.length === 0}
        >
          {tables
            .filter(table => table.status === 'available')
            .map(table => (
              <MenuItem key={table.table_number} value={table.table_number}>
                Table {table.table_number} (Capacity: {table.capacity})
              </MenuItem>
            ))
          }
        </Select>
      </FormControl>
    );
  };

  const handleSubmitOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!order.table_number) {
        setError('Please select a table');
        return;
      }
      if (order.items.length === 0) {
        setError('Please add at least one item to the order');
        return;
      }

      // Create order
      const response = await apiService.post('/orders/', {
        table: order.table_number,
        items: order.items.map(item => ({
          menu_item: item.id,
          quantity: item.quantity,
          notes: item.notes || ''
        })),
        special_instructions: order.special_instructions,
        priority: order.priority,
        estimated_preparation_time: order.estimated_preparation_time
      });

      // Show success message
      toast.success('Order created successfully');

      // Navigate back to orders list
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading order page...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchInitialData}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Order
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Menu Items</Typography>
            
            <Tabs 
              value={selectedCategory} 
              onChange={(e, newValue) => setSelectedCategory(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab label="All" value="all" />
              {menuCategories.map(category => (
                <Tab key={category} label={category} value={category} />
              ))}
            </Tabs>

            <Grid container spacing={2}>
              {menuItems
                .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
                .map(menuItem => (
                  <Grid item xs={12} sm={6} key={menuItem.id}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{menuItem.name}</Typography>
                        <Typography variant="subtitle1">${menuItem.price}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {menuItem.description}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        onClick={() => handleAddItem(menuItem)}
                        disabled={!menuItem.is_available}
                        startIcon={<AddIcon />}
                      >
                        Add to Order
                        {!menuItem.is_available && ' (Unavailable)'}
                      </Button>
                    </Paper>
                  </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Order Details</Typography>
            
            {renderTableSelection()}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={order.priority}
                label="Priority"
                onChange={(e) => setOrder(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Special Instructions"
              value={order.special_instructions}
              onChange={(e) => setOrder(prev => ({ ...prev, special_instructions: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Estimated Preparation Time: {order.estimated_preparation_time} minutes
            </Typography>

            <Box sx={{ mb: 2 }}>
              {order.items.map(item => (
                <Box 
                  key={item.id}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    mb: 1,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body1">
                    {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        size="small"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                      <IconButton 
                        size="small"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Total:
              </Typography>
              <Typography variant="h6">
                ${order.total_price.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/orders')}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                disabled={!canSubmitOrder()}
                onClick={handleSubmitOrder}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Submitting...' : 'Submit Order'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Order Preview Dialog */}
      <Dialog 
        open={showPreview} 
        onClose={() => setShowPreview(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Order Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Table: {order.table_number}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Priority: <Chip 
                label={order.priority.toUpperCase()} 
                color={
                  order.priority === 'urgent' ? 'error' :
                  order.priority === 'high' ? 'warning' :
                  order.priority === 'normal' ? 'primary' : 'default'
                }
                size="small"
              />
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Estimated Time: {order.estimated_preparation_time} minutes
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>Items:</Typography>
          {order.items.map(item => (
            <Box 
              key={item.id}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mb: 1
              }}
            >
              <Typography>
                {item.name} x {item.quantity}
              </Typography>
              <Typography>
                ${(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))}

          {order.special_instructions && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Special Instructions:
              </Typography>
              <Typography variant="body2">
                {order.special_instructions}
              </Typography>
            </Box>
          )}

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6">${order.total_price.toFixed(2)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setShowPreview(false);
              handleSubmitOrder();
            }}
          >
            Confirm & Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NewOrder;
