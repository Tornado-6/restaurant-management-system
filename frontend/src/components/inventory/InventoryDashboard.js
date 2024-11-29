import React, { useState, useEffect, useMemo } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Paper, 
    TableContainer, 
    Table, 
    TableHead, 
    TableRow, 
    TableCell, 
    TableBody, 
    Chip, 
    Button, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { 
    Inventory as InventoryIcon, 
    Warning as WarningIcon, 
    Add as AddIcon, 
    Edit as EditIcon 
} from '@mui/icons-material';

import { apiService } from '../../services/apiService';
import { formatCurrency } from '../../utils/formatters';

const InventoryDashboard = () => {
    const [ingredients, setIngredients] = useState([]);
    const [summary, setSummary] = useState(null);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);

    const fetchIngredients = async () => {
        try {
            const ingredientsResponse = await apiService.get('/kitchen/ingredients/');
            const summaryResponse = await apiService.get('/kitchen/ingredients/inventory_summary/');
            
            setIngredients(ingredientsResponse.data);
            setSummary(summaryResponse.data);
        } catch (error) {
            console.error('Failed to fetch ingredients', error);
        }
    };

    useEffect(() => {
        fetchIngredients();
    }, []);

    const lowStockIngredients = useMemo(() => 
        ingredients.filter(ingredient => ingredient.is_low_stock), 
        [ingredients]
    );

    const handleAddIngredient = async (data) => {
        try {
            await apiService.post('/kitchen/ingredients/', data);
            fetchIngredients();
            setOpenAddModal(false);
        } catch (error) {
            console.error('Failed to add ingredient', error);
        }
    };

    const handleUpdateStock = async (ingredientId, stockData) => {
        try {
            await apiService.post(`/kitchen/ingredients/${ingredientId}/update_stock/`, stockData);
            fetchIngredients();
        } catch (error) {
            console.error('Failed to update stock', error);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Inventory Management
            </Typography>

            {summary && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6">Total Ingredients</Typography>
                            <Typography variant="h4">{summary.total_ingredients}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: lowStockIngredients.length > 0 ? 'warning.light' : 'success.light' }}>
                            <Typography variant="h6">Low Stock Ingredients</Typography>
                            <Typography variant="h4">
                                {summary.low_stock_count}
                                {summary.low_stock_count > 0 && <WarningIcon color="error" />}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6">Total Inventory Value</Typography>
                            <Typography variant="h4">
                                {formatCurrency(summary.total_value || 0)}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
                    <Typography variant="h6">Ingredient Inventory</Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={() => setOpenAddModal(true)}
                    >
                        Add Ingredient
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell>Reorder Level</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ingredients.map((ingredient) => (
                                <TableRow key={ingredient.id}>
                                    <TableCell>{ingredient.name}</TableCell>
                                    <TableCell>{ingredient.category}</TableCell>
                                    <TableCell>{ingredient.quantity}</TableCell>
                                    <TableCell>{ingredient.unit}</TableCell>
                                    <TableCell>{ingredient.reorder_level}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={ingredient.is_low_stock ? 'Low Stock' : 'In Stock'}
                                            color={ingredient.is_low_stock ? 'warning' : 'success'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            startIcon={<EditIcon />}
                                            onClick={() => {
                                                setSelectedIngredient(ingredient);
                                                setOpenAddModal(true);
                                            }}
                                        >
                                            Update
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <IngredientModal 
                open={openAddModal}
                onClose={() => {
                    setOpenAddModal(false);
                    setSelectedIngredient(null);
                }}
                onSubmit={handleAddIngredient}
                ingredient={selectedIngredient}
            />
        </Box>
    );
};

const IngredientModal = ({ open, onClose, onSubmit, ingredient }) => {
    const [formData, setFormData] = useState({
        name: '',
        quantity: 0,
        unit: 'pcs',
        category: 'dry_goods',
        reorder_level: 10,
        cost_per_unit: 1.00,
        is_perishable: false,
        expiration_date: null
    });

    useEffect(() => {
        if (ingredient) {
            setFormData({
                ...ingredient,
                expiration_date: ingredient.expiration_date || null
            });
        } else {
            // Reset form when no ingredient is selected
            setFormData({
                name: '',
                quantity: 0,
                unit: 'pcs',
                category: 'dry_goods',
                reorder_level: 10,
                cost_per_unit: 1.00,
                is_perishable: false,
                expiration_date: null
            });
        }
    }, [ingredient]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const UNIT_CHOICES = [
        { value: 'kg', label: 'Kilograms' },
        { value: 'g', label: 'Grams' },
        { value: 'l', label: 'Liters' },
        { value: 'ml', label: 'Milliliters' },
        { value: 'pcs', label: 'Pieces' }
    ];

    const CATEGORY_CHOICES = [
        { value: 'produce', label: 'Produce' },
        { value: 'meat', label: 'Meat' },
        { value: 'dairy', label: 'Dairy' },
        { value: 'dry_goods', label: 'Dry Goods' },
        { value: 'spices', label: 'Spices' },
        { value: 'beverages', label: 'Beverages' }
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {ingredient ? 'Update Ingredient' : 'Add New Ingredient'}
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2, mt: 2 }}>
                    <TextField
                        name="name"
                        label="Ingredient Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        fullWidth
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                name="quantity"
                                label="Quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Unit</InputLabel>
                                <Select
                                    name="unit"
                                    value={formData.unit}
                                    label="Unit"
                                    onChange={handleChange}
                                >
                                    {UNIT_CHOICES.map(unit => (
                                        <MenuItem key={unit.value} value={unit.value}>
                                            {unit.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    label="Category"
                                    onChange={handleChange}
                                >
                                    {CATEGORY_CHOICES.map(category => (
                                        <MenuItem key={category.value} value={category.value}>
                                            {category.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="reorder_level"
                                label="Reorder Level"
                                type="number"
                                value={formData.reorder_level}
                                onChange={handleChange}
                                required
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                name="cost_per_unit"
                                label="Cost per Unit"
                                type="number"
                                value={formData.cost_per_unit}
                                onChange={handleChange}
                                inputProps={{ step: 0.01 }}
                                required
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="expiration_date"
                                label="Expiration Date"
                                type="date"
                                value={formData.expiration_date || ''}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            name="is_perishable"
                            checked={formData.is_perishable}
                            onChange={handleChange}
                        />
                        <Typography sx={{ ml: 1 }}>Is Perishable?</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button onClick={onClose} sx={{ mr: 2 }}>Cancel</Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary"
                        >
                            {ingredient ? 'Update' : 'Add'}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default InventoryDashboard;
