import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Autocomplete,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import api from '../../services/api';

const initialState = {
  name: '',
  description: '',
  price: '',
  category: '',
  preparation_time: '',
  is_available: true,
  image: null
};

const categories = [
  'Appetizers',
  'Main Course',
  'Desserts',
  'Beverages',
  'Sides',
  'Specials'
];

function MenuItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isEditing) {
      fetchMenuItem();
    }
    fetchIngredients();
  }, [isEditing]);

  const fetchMenuItem = async () => {
    try {
      const response = await api.get(`/kitchen/menu-items/${id}/`);
      const menuItem = response.data;
      setFormData({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        preparation_time: menuItem.preparation_time,
        is_available: menuItem.is_available
      });
      if (menuItem.ingredients) {
        setSelectedIngredients(menuItem.ingredients.map(ing => ({
          ingredient: ing.ingredient,
          quantity: ing.quantity
        })));
      }
    } catch (err) {
      console.error('Error fetching menu item:', err);
      setError('Failed to load menu item');
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/kitchen/ingredients/');
      setIngredients(response.data);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to load ingredients');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add ingredients
      selectedIngredients.forEach((ing, index) => {
        formDataToSend.append('ingredients', JSON.stringify({
          ingredient: ing.ingredient,
          quantity: ing.quantity
        }));
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (isEditing) {
        await api.put(`/kitchen/menu-items/${id}/`, formDataToSend, config);
      } else {
        await api.post('/kitchen/menu-items/', formDataToSend, config);
      }

      navigate('/kitchen/menu-items');
    } catch (err) {
      console.error('Menu Item Submission Error:', err);
      setError(err.response?.data?.detail || 'Failed to submit menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {isEditing ? 'Edit Menu Item' : 'Create New Menu Item'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Preparation Time (minutes)"
                name="preparation_time"
                type="number"
                value={formData.preparation_time}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={ingredients}
                getOptionLabel={(option) => option.name}
                value={ingredients.filter(ing => 
                  selectedIngredients.some(selected => selected.ingredient === ing.id)
                )}
                onChange={(event, newValue) => {
                  setSelectedIngredients(newValue.map(ing => ({
                    ingredient: ing.id,
                    quantity: 1
                  })));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ingredients"
                    placeholder="Add ingredients"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="image-upload">
                <Button variant="outlined" component="span">
                  Upload Image
                </Button>
              </label>
              {imagePreview && (
                <Box mt={2}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '200px', maxHeight: '200px' }} 
                  />
                </Box>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/kitchen/menu-items')}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
            >
              {isEditing ? 'Update' : 'Create'} Menu Item
            </LoadingButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default MenuItemForm;
