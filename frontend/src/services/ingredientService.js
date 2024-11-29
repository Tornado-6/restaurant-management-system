import axios from 'axios';
import { apiClient } from './apiClient';

export const ingredientService = {
  // Get all ingredients with optional filtering
  getIngredients: async (filters = {}) => {
    try {
      const response = await apiClient.get('/kitchen/ingredients/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }
  },

  // Get a single ingredient by ID
  getIngredientById: async (id) => {
    try {
      const response = await apiClient.get(`/kitchen/ingredients/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ingredient ${id}:`, error);
      throw error;
    }
  },

  // Create a new ingredient
  createIngredient: async (ingredientData) => {
    try {
      const response = await apiClient.post('/kitchen/ingredients/', ingredientData);
      return response.data;
    } catch (error) {
      console.error('Error creating ingredient:', error);
      throw error;
    }
  },

  // Update an existing ingredient
  updateIngredient: async (id, ingredientData) => {
    try {
      const response = await apiClient.put(`/kitchen/ingredients/${id}/`, ingredientData);
      return response.data;
    } catch (error) {
      console.error(`Error updating ingredient ${id}:`, error);
      throw error;
    }
  },

  // Delete an ingredient
  deleteIngredient: async (id) => {
    try {
      await apiClient.delete(`/kitchen/ingredients/${id}/`);
    } catch (error) {
      console.error(`Error deleting ingredient ${id}:`, error);
      throw error;
    }
  },

  // Get low stock ingredients
  getLowStockIngredients: async () => {
    try {
      const response = await apiClient.get('/kitchen/ingredients/low_stock/');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock ingredients:', error);
      throw error;
    }
  },

  // Update stock for a specific ingredient
  updateIngredientStock: async (id, stockData) => {
    try {
      const response = await apiClient.post(`/kitchen/ingredients/${id}/update_stock/`, stockData);
      return response.data;
    } catch (error) {
      console.error(`Error updating stock for ingredient ${id}:`, error);
      throw error;
    }
  },

  // Get inventory transactions for an ingredient
  getInventoryTransactions: async (ingredientId, params = {}) => {
    try {
      const response = await apiClient.get(`/kitchen/inventory-transactions/`, {
        params: { ...params, ingredient_id: ingredientId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      throw error;
    }
  }
};
