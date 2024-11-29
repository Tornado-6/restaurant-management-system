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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    reorder_level: '',
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/kitchen/ingredients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIngredients(response.data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setError('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ingredient = null) => {
    if (ingredient) {
      setSelectedIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        reorder_level: ingredient.reorder_level,
      });
    } else {
      setSelectedIngredient(null);
      setFormData({
        name: '',
        quantity: '',
        unit: '',
        reorder_level: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIngredient(null);
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      reorder_level: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (selectedIngredient) {
        await axios.put(
          `${API_URL}/kitchen/ingredients/${selectedIngredient.id}/`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post(
          `${API_URL}/kitchen/ingredients/`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      fetchIngredients();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      setError('Failed to save ingredient');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/kitchen/ingredients/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchIngredients();
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        setError('Failed to delete ingredient');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Ingredient
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Reorder Level</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ingredients.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell>{ingredient.name}</TableCell>
                        <TableCell align="right">{ingredient.quantity}</TableCell>
                        <TableCell>{ingredient.unit}</TableCell>
                        <TableCell align="right">
                          {ingredient.reorder_level}
                        </TableCell>
                        <TableCell>
                          {ingredient.quantity <= ingredient.reorder_level && (
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                              <WarningIcon sx={{ mr: 1 }} />
                              Low Stock
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(ingredient)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(ingredient.id)}
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
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reorder Level"
                  name="reorder_level"
                  type="number"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedIngredient ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Inventory;
