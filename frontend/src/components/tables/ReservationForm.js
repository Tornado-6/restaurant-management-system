import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid 
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { addReservation } from '../../store/slices/tableSlice';

const ReservationForm = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    customerName: '',
    tableNumber: '',
    date: '',
    time: '',
    status: 'Pending'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addReservation(formData));
    // Reset form or navigate
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        New Reservation
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Table Number"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Time"
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
            >
              Create Reservation
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default ReservationForm;
