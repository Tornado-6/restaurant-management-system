import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
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
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const statusColors = {
  pending: 'warning',
  preparing: 'info',
  ready: 'success',
  served: 'default',
  cancelled: 'error',
};

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/orders/${id}/update_status/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrder();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/orders/${id}/process_payment/`,
        {
          payment_method: paymentMethod,
          transaction_id: Date.now().toString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenPaymentDialog(false);
      fetchOrder();
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!order) {
    return <Typography>Order not found</Typography>;
  }

  const getStatusActions = () => {
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

  const formattedDate = format(new Date(order.created_at), 'PPpp');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Order #{order.id}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Table
                  </Typography>
                  <Typography variant="body1">
                    Table {order.table_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    color={statusColors[order.status]}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formattedDate}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Waiter
                  </Typography>
                  <Typography variant="body1">
                    {order.waiter_name}
                  </Typography>
                </Grid>
                {order.special_instructions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Special Instructions
                    </Typography>
                    <Typography variant="body1">
                      {order.special_instructions}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Items
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.menu_item_details.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>{item.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Summary
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal</Typography>
                  <Typography>${order.total_amount.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6">${order.total_amount.toFixed(2)}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {getStatusActions().map(([status, label]) => (
                  <Button
                    key={status}
                    variant="outlined"
                    onClick={() => handleStatusChange(status)}
                    fullWidth
                  >
                    {label}
                  </Button>
                ))}
                {!order.is_paid && order.status !== 'cancelled' && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenPaymentDialog(true)}
                    fullWidth
                  >
                    Process Payment
                  </Button>
                )}
                {order.is_paid && (
                  <Chip
                    label="Paid"
                    color="success"
                    sx={{ alignSelf: 'center' }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handlePayment}
            loading={processingPayment}
            variant="contained"
          >
            Complete Payment
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OrderDetails;
