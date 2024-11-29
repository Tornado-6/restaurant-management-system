import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { register, clearError } from '../../store/slices/authSlice';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'waiter', // Default role
    phone_number: '',
    address: '',
  });

  // Track individual field errors
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: '',
    phone_number: '',
  });

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'waiter', label: 'Waiter' },
    { value: 'chef', label: 'Chef' },
    { value: 'cashier', label: 'Cashier' },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => {
      dispatch(clearError());
      setFieldErrors({});
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear specific field error when user starts typing
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset field errors
    setFieldErrors({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: '',
      phone_number: '',
    });

    try {
      await dispatch(register(formData)).unwrap();
      // If registration is successful, navigate to login
      navigate('/login');
    } catch (error) {
      // Handle specific field errors
      if (error && typeof error === 'object') {
        setFieldErrors(prev => ({
          ...prev,
          ...error
        }));
      }
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Staff Registration
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {typeof error === 'string' ? error : 'Registration failed'}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                name="first_name"
                label="First Name"
                value={formData.first_name}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.first_name}
                helperText={fieldErrors.first_name}
              />
              <TextField
                name="last_name"
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                fullWidth
                required
                error={!!fieldErrors.last_name}
                helperText={fieldErrors.last_name}
              />
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || 'Must include uppercase, lowercase, number, and special character'}
            />
            
            <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
              <TextField
                name="phone_number"
                label="Phone Number (Optional)"
                value={formData.phone_number}
                onChange={handleChange}
                fullWidth
                error={!!fieldErrors.phone_number}
                helperText={fieldErrors.phone_number}
              />
              
              <FormControl fullWidth error={!!fieldErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Role"
                  onChange={handleChange}
                >
                  {roleOptions.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.role && (
                  <FormHelperText>{fieldErrors.role}</FormHelperText>
                )}
              </FormControl>
            </Box>
            
            <TextField
              margin="normal"
              fullWidth
              name="address"
              label="Address (Optional)"
              multiline
              rows={3}
              value={formData.address}
              onChange={handleChange}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register;
