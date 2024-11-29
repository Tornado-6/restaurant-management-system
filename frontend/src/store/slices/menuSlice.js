import { createSlice } from '@reduxjs/toolkit';

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    menuItems: [],
    loading: false,
    error: null
  },
  reducers: {
    setMenuItems: (state, action) => {
      state.menuItems = action.payload;
    },
    addMenuItem: (state, action) => {
      state.menuItems.push(action.payload);
    },
    updateMenuItem: (state, action) => {
      const index = state.menuItems.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.menuItems[index] = action.payload;
      }
    },
    deleteMenuItem: (state, action) => {
      state.menuItems = state.menuItems.filter(item => item.id !== action.payload);
    }
  }
});

export const { 
  setMenuItems, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} = menuSlice.actions;

export default menuSlice.reducer;
