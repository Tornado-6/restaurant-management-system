import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const ROLE_CHOICES = [
  'admin', 
  'manager', 
  'waiter', 
  'chef', 
  'cashier'
];

function Users() {
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [currentUser, setCurrentUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    phone_number: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Check if user has permission to manage users
  const canManageUsers = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users/');
      setUsers(response.data);
    } catch (error) {
      handleError('Error fetching users', error);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!currentUser.username) errors.username = 'Username is required';
    if (!currentUser.email) errors.email = 'Email is required';
    if (!currentUser.role) errors.role = 'Role is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentUser.email && !emailRegex.test(currentUser.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (user = null) => {
    if (!canManageUsers) {
      handleError('You do not have permission to manage users');
      return;
    }

    if (user) {
      setCurrentUser(user);
      setIsEditing(true);
    } else {
      setCurrentUser({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: '',
        phone_number: '',
        address: ''
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      const newErrors = { ...formErrors };
      delete newErrors[name];
      setFormErrors(newErrors);
    }
  };

  const handleSubmit = async () => {
    if (!canManageUsers) {
      handleError('You do not have permission to manage users');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/auth/users/${currentUser.id}/`, currentUser);
        handleSuccess('User updated successfully');
      } else {
        await api.post('/auth/users/', currentUser);
        handleSuccess('User created successfully');
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      handleError('Error saving user', error);
    }
  };

  const handleDelete = async (userId) => {
    if (!canManageUsers) {
      handleError('You do not have permission to manage users');
      return;
    }

    try {
      await api.delete(`/auth/users/${userId}/`);
      handleSuccess('User deleted successfully');
      fetchUsers();
    } catch (error) {
      handleError('Error deleting user', error);
    }
  };

  const handleError = (message, error = null) => {
    console.error(message, error);
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
  };

  const handleSuccess = (message) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // If user doesn't have permission, show error message
  if (!canManageUsers) {
    return (
      <Box>
        <Alert severity="error">
          You do not have permission to access the Users Management page. 
          Only administrators and managers can manage users.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Users Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
        >
          Add New User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button 
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(user)}
                  >
                    Edit
                  </Button>
                  <Button 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="username"
            label="Username"
            fullWidth
            value={currentUser.username}
            onChange={handleChange}
            error={!!formErrors.username}
            helperText={formErrors.username}
            required
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={currentUser.email}
            onChange={handleChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
            required
          />
          <TextField
            margin="dense"
            name="first_name"
            label="First Name"
            fullWidth
            value={currentUser.first_name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="last_name"
            label="Last Name"
            fullWidth
            value={currentUser.last_name}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={currentUser.role}
              label="Role"
              onChange={handleChange}
              error={!!formErrors.role}
            >
              {ROLE_CHOICES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="phone_number"
            label="Phone Number"
            fullWidth
            value={currentUser.phone_number}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address"
            fullWidth
            multiline
            rows={2}
            value={currentUser.address}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Users;
