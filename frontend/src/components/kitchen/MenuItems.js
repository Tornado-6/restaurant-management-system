import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const API_URL = 'http://localhost:8000/api';

const categories = [
  'Appetizers',
  'Main Course',
  'Desserts',
  'Beverages',
  'Specials',
];

function MenuItems() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get(`${API_URL}/kitchen/menu-items/`);
      setMenuItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Detailed Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      setError(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to fetch menu items. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      await api.post(`${API_URL}/kitchen/menu-items/${id}/toggle_availability/`);
      setMenuItems(menuItems.map(item => 
        item.id === id 
          ? { ...item, is_available: !currentStatus }
          : item
      ));
    } catch (error) {
      console.error('Error toggling availability:', error);
      setError('Failed to toggle item availability.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`${API_URL}/kitchen/menu-items/${id}/`);
        setMenuItems(menuItems.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting menu item:', error);
        setError('Failed to delete menu item.');
      }
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleCloseError = () => {
    setError(null);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Menu Items</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/kitchen/menu-items/new')}
        >
          Add New Item
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {filteredItems.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center">
          No menu items found
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                {item.image && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={item.image}
                    alt={item.name}
                  />
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div">
                      {item.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/kitchen/menu-items/${item.id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      ${item.price}
                    </Typography>
                    <Chip
                      label={item.is_available ? 'Available' : 'Unavailable'}
                      color={item.is_available ? 'success' : 'error'}
                      onClick={() => handleToggleAvailability(item.id, item.is_available)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={item.category}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${item.preparation_time} min`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default MenuItems;
