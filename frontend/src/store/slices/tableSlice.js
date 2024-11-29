import { createSlice } from '@reduxjs/toolkit';

const tableSlice = createSlice({
  name: 'tables',
  initialState: {
    tables: [],
    reservations: [],
    loading: false,
    error: null
  },
  reducers: {
    setTables: (state, action) => {
      state.tables = action.payload;
    },
    updateTable: (state, action) => {
      const index = state.tables.findIndex(table => table.id === action.payload.id);
      if (index !== -1) {
        state.tables[index] = action.payload;
      }
    },
    setReservations: (state, action) => {
      state.reservations = action.payload;
    },
    addReservation: (state, action) => {
      state.reservations.push(action.payload);
    },
    updateReservation: (state, action) => {
      const index = state.reservations.findIndex(res => res.id === action.payload.id);
      if (index !== -1) {
        state.reservations[index] = action.payload;
      }
    }
  }
});

export const { 
  setTables, 
  updateTable, 
  setReservations, 
  addReservation, 
  updateReservation 
} = tableSlice.actions;

export default tableSlice.reducer;
