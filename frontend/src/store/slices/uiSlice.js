import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isLoading: false,
    error: null,
    notification: null
  },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setNotification: (state, action) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    }
  }
});

export const { 
  setLoading, 
  setError, 
  clearError, 
  setNotification, 
  clearNotification 
} = uiSlice.actions;

export default uiSlice.reducer;
