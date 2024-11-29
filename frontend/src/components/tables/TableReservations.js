import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function TableReservations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    party_size: '',
    reservation_date: '',
    reservation_time: '',
    special_requests: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchTableDetails();
    fetchReservations();
  }, [id]);

  const fetchTableDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tables/tables/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTable(response.data);
    } catch (error) {
      console.error('Error fetching table details:', error);
      setError('Failed to load table details');
    }
  };

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tables/tables/${id}/reservations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (reservation = null) => {
    if (reservation) {
      setSelectedReservation(reservation);
      const reservationDate = new Date(reservation.reservation_datetime);
      setFormData({
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone,
        party_size: reservation.party_size,
        reservation_date: format(reservationDate, 'yyyy-MM-dd'),
        reservation_time: format(reservationDate, 'HH:mm'),
        special_requests: reservation.special_requests,
        status: reservation.status,
      });
    } else {
      setSelectedReservation(null);
      setFormData({
        customer_name: '',
        customer_phone: '',
        party_size: '',
        reservation_date: '',
        reservation_time: '',
        special_requests: '',
        status: 'pending',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReservation(null);
    setFormData({
      customer_name: '',
      customer_phone: '',
      party_size: '',
      reservation_date: '',
      reservation_time: '',
      special_requests: '',
      status: 'pending',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const reservationData = {
        ...formData,
        table: id,
        reservation_datetime: `${formData.reservation_date}T${formData.reservation_time}`,
      };

      if (selectedReservation) {
        await axios.put(
          `${API_URL}/tables/reservations/${selectedReservation.id}/`,
          reservationData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/tables/reservations/`,
          reservationData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      handleCloseDialog();
      fetchReservations();
    } catch (error) {
      console.error('Error saving reservation:', error);
      setError('Failed to save reservation');
    }
  };

  const handleDelete = async (reservationId) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/tables/reservations/${reservationId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReservations();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      setError('Failed to delete reservation');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!table) {
    return <Typography>Table not found</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4">
            Table {table.table_number} Reservations
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Capacity: {table.capacity} seats | Location: {table.location}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/tables')}
            sx={{ mr: 2 }}
          >
            Back to Tables
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Reservation
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Party Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Special Requests</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {reservation.customer_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reservation.customer_phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(reservation.reservation_datetime), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{reservation.party_size}</TableCell>
                    <TableCell>
                      <Chip
                        label={reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        color={getStatusColor(reservation.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{reservation.special_requests || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(reservation)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(reservation.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedReservation ? 'Edit Reservation' : 'New Reservation'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Party Size"
                name="party_size"
                type="number"
                value={formData.party_size}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                name="reservation_date"
                type="date"
                value={formData.reservation_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                name="reservation_time"
                type="time"
                value={formData.reservation_time}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Requests"
                name="special_requests"
                multiline
                rows={3}
                value={formData.special_requests}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={loading}
          >
            {selectedReservation ? 'Update' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TableReservations;
