import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null
  },
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    addOrder: (state, action) => {
      state.orders.push(action.payload);
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    }
  }
});

export const { 
  setOrders, 
  addOrder, 
  updateOrder, 
  setCurrentOrder 
} = orderSlice.actions;

export default orderSlice.reducer;
