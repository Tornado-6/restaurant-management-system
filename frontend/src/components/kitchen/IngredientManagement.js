import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Warning as WarningIcon 
} from '@mui/icons-material';

import IngredientForm from './IngredientForm';
import { apiService } from '../../services/apiService';

const IngredientManagement = () => {
  const [ingredients, setIngredients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch ingredients
  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/kitchen/ingredients/');
      setIngredients(response);
    } catch (err) {
      setError('Failed to fetch ingredients');
      console.error('Ingredients fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle ingredient add/edit
  const handleIngredientAdded = async (ingredientData) => {
    try {
      // If editing existing ingredient
      if (selectedIngredient) {
        const updatedIngredient = await apiService.put(
          `/kitchen/ingredients/${selectedIngredient.id}/`, 
          ingredientData
        );
        
        // Update ingredients list
        setIngredients(prev => 
          prev.map(ing => 
            ing.id === updatedIngredient.id ? updatedIngredient : ing
          )
        );
        
        setSuccessMessage('Ingredient updated successfully');
      } else {
        // Adding new ingredient
        const newIngredient = await apiService.post('/kitchen/ingredients/', ingredientData);
        
        // Add to ingredients list
        setIngredients(prev => [...prev, newIngredient]);
        
        setSuccessMessage('Ingredient added successfully');
      }

      // Close dialog and reset selected ingredient
      setOpenDialog(false);
      setSelectedIngredient(null);
    } catch (err) {
      setError('Failed to save ingredient');
      console.error('Ingredient save error:', err);
    }
  };

  // Delete ingredient
  const handleDeleteIngredient = async (ingredientId) => {
    try {
      await apiService.delete(`/kitchen/ingredients/${ingredientId}/`);
      
      // Remove from ingredients list
      setIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
      
      setSuccessMessage('Ingredient deleted successfully');
    } catch (err) {
      setError('Failed to delete ingredient');
      console.error('Ingredient delete error:', err);
    }
  };

  // Open dialog for adding/editing
  const openIngredientDialog = (ingredient = null) => {
    setSelectedIngredient(ingredient);
    setOpenDialog(true);
  };

  // Close dialog handler
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIngredient(null);
  };

  // Initial fetch
  useEffect(() => {
    fetchIngredients();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ingredient Management
      </Typography>

      {/* Add Ingredient Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => openIngredientDialog()}
        >
          Add Ingredient
        </Button>
      </Box>

      {/* Ingredients Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Cost per Unit</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingredients.map((ingredient) => (
              <TableRow key={ingredient.id}>
                <TableCell>{ingredient.name}</TableCell>
                <TableCell>{ingredient.quantity}</TableCell>
                <TableCell>{ingredient.unit}</TableCell>
                <TableCell>{ingredient.category}</TableCell>
                <TableCell>${ingredient.cost_per_unit}</TableCell>
                <TableCell>
                  <Tooltip title="Edit Ingredient">
                    <IconButton 
                      color="primary" 
                      onClick={() => openIngredientDialog(ingredient)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Ingredient">
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteIngredient(ingredient.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  {ingredient.is_low_stock && (
                    <Tooltip title="Low Stock Warning">
                      <WarningIcon color="warning" />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ingredient Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
        </DialogTitle>
        <DialogContent>
          <IngredientForm 
            onIngredientAdded={handleIngredientAdded}
            initialData={selectedIngredient}
          />
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IngredientManagement;
