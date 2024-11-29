import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Divider,
  Badge,
  Alert,
} from '@mui/material';
import {
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalDining as DiningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { websocketService } from '../../services/websocket';

const API_URL = 'http://localhost:8000/api';

const priorityColors = {
  high: '#ffebee',
  medium: '#fff3e0',
  normal: 'inherit',
};

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    preparingOrders: 0,
    avgPrepTime: 0,
  });

  useEffect(() => {
    const ws = websocketService.connect();
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'order_update') {
        handleOrderUpdate(data.order);
      }
    };

    fetchOrders();
    const interval = setInterval(updateWaitTimes, 60000); // Update wait times every minute

    return () => {
      websocketService.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prevOrders => {
      const newOrders = prevOrders.map(order =>
        order.id === updatedOrder.id ? updatedOrder : order
      );
      updateStats(newOrders);
      return newOrders;
    });
  };

  const updateStats = (ordersList) => {
    const pendingOrders = ordersList.filter(o => o.status === 'pending').length;
    const preparingOrders = ordersList.filter(o => o.status === 'preparing').length;
    const completedOrders = ordersList.filter(o => o.status === 'ready' || o.status === 'served');
    
    const avgPrepTime = completedOrders.reduce((acc, order) => {
      const prepTime = new Date(order.completed_at) - new Date(order.created_at);
      return acc + prepTime;
    }, 0) / (completedOrders.length || 1);

    setStats({
      pendingOrders,
      preparingOrders,
      avgPrepTime: Math.round(avgPrepTime / 60000), // Convert to minutes
    });
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status__in: 'pending,preparing',
        },
      });
      setOrders(response.data);
      updateStats(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch orders');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/orders/${orderId}/update_status/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const getWaitTime = (createdAt) => {
    const waitTime = Math.round((new Date() - new Date(createdAt)) / 60000);
    return waitTime;
  };

  const getPriority = (waitTime) => {
    if (waitTime > 30) return 'high';
    if (waitTime > 15) return 'medium';
    return 'normal';
  };

  const updateWaitTimes = () => {
    setOrders(prevOrders => [...prevOrders]); // Force re-render to update wait times
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Orders
              </Typography>
              <Typography variant="h4">{stats.pendingOrders}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Preparing Orders
              </Typography>
              <Typography variant="h4">{stats.preparingOrders}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Prep Time
              </Typography>
              <Typography variant="h4">{stats.avgPrepTime} mins</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders Grid */}
      <Grid container spacing={2}>
        {/* Pending Orders Column */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pending Orders
          </Typography>
          <Grid container spacing={2}>
            {orders
              .filter(order => order.status === 'pending')
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map(order => {
                const waitTime = getWaitTime(order.created_at);
                const priority = getPriority(waitTime);
                return (
                  <Grid item xs={12} key={order.id}>
                    <Card sx={{ backgroundColor: priorityColors[priority] }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">
                            Order #{order.id} - Table {order.table_number}
                          </Typography>
                          <Box>
                            <Badge badgeContent={waitTime} color="error" sx={{ mr: 2 }}>
                              <TimerIcon />
                            </Badge>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                            >
                              Start Preparing
                            </Button>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        {order.items.map((item, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                            <DiningIcon sx={{ mr: 1 }} />
                            <Typography>
                              {item.quantity}x {item.menu_item.name}
                            </Typography>
                            {item.special_instructions && (
                              <Chip
                                icon={<InfoIcon />}
                                label={item.special_instructions}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </Grid>

        {/* Preparing Orders Column */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Preparing
          </Typography>
          <Grid container spacing={2}>
            {orders
              .filter(order => order.status === 'preparing')
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map(order => {
                const waitTime = getWaitTime(order.created_at);
                return (
                  <Grid item xs={12} key={order.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">
                            Order #{order.id} - Table {order.table_number}
                          </Typography>
                          <Box>
                            <Badge badgeContent={waitTime} color="warning" sx={{ mr: 2 }}>
                              <TimerIcon />
                            </Badge>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              sx={{ mr: 1 }}
                            >
                              Mark Ready
                            </Button>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        {order.items.map((item, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                            <DiningIcon sx={{ mr: 1 }} />
                            <Typography>
                              {item.quantity}x {item.menu_item.name}
                            </Typography>
                            {item.special_instructions && (
                              <Chip
                                icon={<InfoIcon />}
                                label={item.special_instructions}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default KitchenDisplay;
