import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  LocalDining as DiningIcon,
} from '@mui/icons-material';
import format from 'date-fns/format';
import { apiService } from '../../services/apiService';
import { websocketService } from '../../services/websocket';

const API_URL = 'http://localhost:8000/api';

const statusColors = {
  pending: 'warning',
  preparing: 'info',
  ready: 'success',
  served: 'default',
  cancelled: 'error',
};

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [orderMetrics, setOrderMetrics] = useState({
    averagePreparationTime: 0,
    pendingOrders: 0,
    completedToday: 0
  });

  useEffect(() => {
    // Explicitly connect WebSocket
    websocketService.connect();

    // Subscribe to order updates
    const unsubscribe = websocketService.subscribe('order_updates', (message) => {
      try {
        const updatedOrder = JSON.parse(message);
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(order => 
            order.id === updatedOrder.id ? updatedOrder : order
          );
          return updatedOrders;
        });
      } catch (error) {
        console.error('Error processing order update:', error);
      }
    });

    fetchOrders();
    calculateMetrics();

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, []);

  const updateOrder = (updatedOrder) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };

  const calculateMetrics = (ordersData = []) => {
    // Ensure ordersData is an array
    const safeOrdersData = Array.isArray(ordersData) ? ordersData : [];
    
    // Safely handle metrics calculation
    const completedOrders = safeOrdersData.filter(order => 
      order && order.status === 'served'
    );
    
    // Calculate average preparation time
    const avgPrepTime = completedOrders.reduce((acc, order) => {
      if (order && order.created_at && order.completed_at) {
        const prepTime = new Date(order.completed_at) - new Date(order.created_at);
        return acc + prepTime;
      }
      return acc;
    }, 0) / (completedOrders.length || 1);

    // Set metrics with safe defaults
    setOrderMetrics({
      averagePreparationTime: Math.round(avgPrepTime / 60000), // Convert to minutes
      pendingOrders: safeOrdersData.filter(order => 
        order && order.status === 'pending'
      ).length,
      completedToday: completedOrders.filter(order => 
        order && 
        new Date(order.completed_at).toDateString() === new Date().toDateString()
      ).length
    });
  };

  const fetchOrders = async () => {
    try {
      // Prepare query parameters
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };

      // Add optional filters
      if (filterStatus) params.status = filterStatus;
      if (dateFilter) params.start_date = dateFilter;

      // Fetch orders using apiService
      const response = await apiService.get('/orders/', params);
      
      // Add debugging logs
      console.log('Fetched Orders Response:', response);
      
      // Ensure we have results and total count
      const ordersData = response.results || [];
      const totalCount = response.count || 0;
      
      // Update state with fetched orders
      setOrders(ordersData);
      
      // Update pagination state
      setPagination(prevState => ({
        ...prevState,
        total: totalCount
      }));

      // Calculate metrics after fetching orders
      calculateMetrics(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      // Reset metrics on error
      setOrderMetrics({
        averagePreparationTime: 0,
        pendingOrders: 0,
        completedToday: 0
      });
      
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prevState => ({
      ...prevState,
      page: newPage + 1
    }));
  };

  const handlePageSizeChange = (event) => {
    setPagination(prevState => ({
      ...prevState,
      pageSize: parseInt(event.target.value, 10)
    }));
  };

  // Trigger fetch when pagination changes
  useEffect(() => {
    fetchOrders();
  }, [pagination.page, pagination.pageSize, filterStatus, dateFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await apiService.post(
        `/orders/${orderId}/status/`,
        { status: newStatus }
      );
      updateOrder(response);
    } catch (error) {
      console.error('Error changing order status:', error);
      // Optional: Add user-friendly error handling
      setError('Failed to update order status');
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getStatusActions = (order) => {
    const actions = [];
    switch (order.status) {
      case 'pending':
        actions.push(['preparing', 'Start Preparing']);
        break;
      case 'preparing':
        actions.push(['ready', 'Mark Ready']);
        break;
      case 'ready':
        actions.push(['served', 'Mark Served']);
        break;
      default:
        break;
    }
    if (!['served', 'cancelled'].includes(order.status)) {
      actions.push(['cancelled', 'Cancel Order']);
    }
    return actions;
  };

  const handleNewOrderClick = () => {
    navigate('/orders/new');
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      await apiService.post('/orders/bulk-update/', {
        order_ids: selectedOrders,
        status: status
      });
      
      // Refresh orders after bulk update
      fetchOrders();
      
      // Clear selected orders
      setSelectedOrders([]);
    } catch (error) {
      console.error('Error in bulk status update:', error);
      setError('Failed to update orders');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewOrderClick}
        >
          New Order
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="preparing">Preparing</MenuItem>
              <MenuItem value="ready">Ready</MenuItem>
              <MenuItem value="served">Served</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            type="date"
            label="Date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Preparation Time
                </Typography>
                <Typography variant="h5">
                  {orderMetrics.averagePreparationTime} minutes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Orders
                </Typography>
                <Typography variant="h5">
                  {orderMetrics.pendingOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed Today
                </Typography>
                <Typography variant="h5">
                  {orderMetrics.completedToday}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {selectedOrders.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleBulkStatusUpdate('preparing')}
            sx={{ mr: 1 }}
          >
            Start Preparing Selected
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleBulkStatusUpdate('ready')}
            sx={{ mr: 1 }}
          >
            Mark Selected as Ready
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleBulkStatusUpdate('cancelled')}
          >
            Cancel Selected
          </Button>
        </Box>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(orders.map(order => order.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Wait Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => {
                  const waitTime = Math.round(
                    (new Date() - new Date(order.created_at)) / 60000
                  );
                  return (
                    <TableRow 
                      key={order.id}
                      sx={{
                        backgroundColor: waitTime > 30 && order.status === 'pending' 
                          ? '#fff3e0' 
                          : 'inherit'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>Table {order.table_number}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DiningIcon sx={{ mr: 1 }} />
                          {order.items.length} items
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          color={statusColors[order.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'PPpp')}
                      </TableCell>
                      <TableCell>
                        {waitTime} minutes
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                        {getStatusActions(order).map(([status, label]) => (
                          <Button
                            key={status}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                            onClick={() => handleStatusChange(order.id, status)}
                          >
                            {label}
                          </Button>
                        ))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.pageSize}
            onRowsPerPageChange={handlePageSizeChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default Orders;
