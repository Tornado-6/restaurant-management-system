import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button 
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

const Reservations = () => {
  const dispatch = useDispatch();
  const { reservations } = useSelector(state => state.table);

  useEffect(() => {
    // Fetch reservations
  }, [dispatch]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Table Reservations
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Table Number</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell>{reservation.tableNumber}</TableCell>
                <TableCell>{reservation.customerName}</TableCell>
                <TableCell>{reservation.date}</TableCell>
                <TableCell>{reservation.time}</TableCell>
                <TableCell>{reservation.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Reservations;
