import React, { useState } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Grid, 
  Button 
} from '@mui/material';
import { apiService } from '../../services/apiService';

const UNIT_CHOICES = [
  // Weight Units
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'lb', label: 'Pounds' },
  { value: 'oz', label: 'Ounces' },
  
  // Volume Units
  { value: 'l', label: 'Liters' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'cup', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons' },
  { value: 'tsp', label: 'Teaspoons' },
  { value: 'fl_oz', label: 'Fluid Ounces' },
  { value: 'gal', label: 'Gallons' },
  
  // Count Units
  { value: 'pcs', label: 'Pieces' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'slice', label: 'Slice' },
  { value: 'pack', label: 'Pack' },
  
  // Specialized Units
  { value: 'can', label: 'Can' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'box', label: 'Box' }
];

const CATEGORY_CHOICES = [
  { value: 'produce', label: 'Produce' },
  { value: 'meat', label: 'Meat' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'dry_goods', label: 'Dry Goods' },
  { value: 'spices', label: 'Spices' },
  { value: 'beverages', label: 'Beverages' }
];

const IngredientForm = ({ onIngredientAdded, initialData = null }) => {
  const [ingredientData, setIngredientData] = useState(initialData || {
    name: '',
    quantity: '',
    unit: 'pcs',
    category: 'dry_goods',
    cost_per_unit: '',
    reorder_level: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIngredientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = initialData 
        ? await apiService.put(`/kitchen/ingredients/${initialData.id}/`, ingredientData)
        : await apiService.post('/kitchen/ingredients/', ingredientData);
      
      if (onIngredientAdded) {
        onIngredientAdded(response);
      }
      
      // Reset form or close modal
      setIngredientData({
        name: '',
        quantity: '',
        unit: 'pcs',
        category: 'dry_goods',
        cost_per_unit: '',
        reorder_level: ''
      });
    } catch (error) {
      console.error('Error saving ingredient:', error.response?.data || error.message);
      // TODO: Add user-friendly error handling
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Ingredient Name"
            name="name"
            value={ingredientData.name}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Quantity"
            name="quantity"
            type="number"
            value={ingredientData.quantity}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Unit</InputLabel>
            <Select
              name="unit"
              value={ingredientData.unit}
              label="Unit"
              onChange={handleChange}
            >
              {UNIT_CHOICES.map((unit) => (
                <MenuItem key={unit.value} value={unit.value}>
                  {unit.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={ingredientData.category}
              label="Category"
              onChange={handleChange}
            >
              {CATEGORY_CHOICES.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Cost per Unit"
            name="cost_per_unit"
            type="number"
            value={ingredientData.cost_per_unit}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            label="Reorder Level"
            name="reorder_level"
            type="number"
            value={ingredientData.reorder_level}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            fullWidth
          >
            {initialData ? 'Update Ingredient' : 'Add Ingredient'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default IngredientForm;
