import React, { useState, useEffect } from 'react';
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
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { websocketService } from '../../services/websocket';
import { apiService } from '../../services/apiService'; 
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8000/api';

function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: '',
    location: '',
  });

  useEffect(() => {
    fetchTables();

    // Subscribe to WebSocket updates
    const unsubscribeTableStatus = websocketService.subscribe('table_status_update', (payload) => {
      setTables(prevTables =>
        prevTables.map(table =>
          table.id === payload.id
            ? { ...table, status: payload.status, current_order: payload.current_order }
            : table
        )
      );
    });

    const unsubscribeReservation = websocketService.subscribe('reservation_update', (payload) => {
      if (payload.table_id) {
        setTables(prevTables =>
          prevTables.map(table =>
            table.id === payload.table_id
              ? { ...table, status: payload.affects_status ? 'reserved' : table.status }
              : table
          )
        );
      }
    });

    return () => {
      unsubscribeTableStatus();
      unsubscribeReservation();
    };
  }, []);

  const fetchTables = async () => {
    try {
      const response = await apiService.get('/tables/');
      // Ensure we have an array of tables
      setTables(Array.isArray(response) ? response : response.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to load tables');
      setTables([]); // Set empty array on error
      setLoading(false);
    }
  };

  const handleOpenDialog = (table = null) => {
    if (table) {
      setSelectedTable(table);
      setFormData({
        table_number: table.table_number,
        capacity: table.capacity,
        location: table.location,
      });
    } else {
      setSelectedTable(null);
      setFormData({
        table_number: '',
        capacity: '',
        location: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTable(null);
    setFormData({
      table_number: '',
      capacity: '',
      location: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setError(null);

    // Validate form data
    if (!formData.table_number) {
      setError('Table number is required');
      return;
    }
    if (!formData.capacity) {
      setError('Capacity is required');
      return;
    }

    // Convert string values to numbers
    const tableData = {
      ...formData,
      table_number: parseInt(formData.table_number, 10),
      capacity: parseInt(formData.capacity, 10),
      status: formData.status || 'available' // Ensure status is set
    };

    // Validate numeric values
    if (tableData.table_number <= 0) {
      setError('Table number must be greater than 0');
      return;
    }
    if (tableData.capacity <= 0) {
      setError('Capacity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      let response;
      
      if (selectedTable) {
        response = await apiService.put(`/tables/${selectedTable.id}/`, tableData);
        
        // Update tables list with new data
        setTables(prevTables => 
          prevTables.map(table => 
            table.id === selectedTable.id ? response : table
          )
        );

        // Send WebSocket update
        websocketService.send('table_status_update', {
          id: selectedTable.id,
          ...response
        });

        toast.success('Table updated successfully');
      } else {
        response = await apiService.post('/tables/', tableData);
        setTables(prevTables => [...prevTables, response]);
        toast.success('Table created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving table:', error);
      
      if (error.response?.data) {
        // Handle Django REST Framework validation errors
        if (typeof error.response.data === 'object') {
          const errorMessages = [];
          Object.entries(error.response.data).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(', ')}`);
            } else if (typeof errors === 'string') {
              errorMessages.push(`${field}: ${errors}`);
            }
          });
          setError(errorMessages.join('\n'));
        } else {
          setError(error.response.data);
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while saving the table');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }

    try {
      await apiService.delete(`/tables/${tableId}/`);
      fetchTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      setError('Failed to delete table');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'reserved':
        return 'warning';
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tables</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Table
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Table Number</TableCell>
                      <TableCell>Capacity</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Current Order</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tables.map((table) => (
                      <TableRow key={table.id}>
                        <TableCell>Table {table.table_number}</TableCell>
                        <TableCell>{table.capacity} seats</TableCell>
                        <TableCell>{table.location}</TableCell>
                        <TableCell>
                          <Chip
                            label={table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                            color={getStatusColor(table.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {table.current_order ? (
                            <Button
                              size="small"
                              variant="outlined"
                              href={`/orders/${table.current_order}`}
                            >
                              View Order #{table.current_order}
                            </Button>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(table)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(table.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            href={`/tables/${table.id}/reservations`}
                          >
                            <EventIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTable ? 'Edit Table' : 'Add Table'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Table Number"
                name="table_number"
                type="number"
                value={formData.table_number}
                onChange={handleInputChange}
                inputProps={{ min: "1" }}
                error={Boolean(error && error.includes('table_number'))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                inputProps={{ min: "1" }}
                error={Boolean(error && error.includes('capacity'))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                placeholder="e.g., Main Hall, Patio, etc."
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
            {selectedTable ? 'Update' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Tables;
