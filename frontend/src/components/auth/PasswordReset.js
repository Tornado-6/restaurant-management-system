import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Paper, 
  Alert, 
  Snackbar 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRequestMode, setIsRequestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Check for token in URL on component mount
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setIsRequestMode(false);
      setToken(urlToken);
    }
  }, [location]);

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/users/password_reset_request/', { email });
      setSuccess(response.data.message);
      setIsRequestMode(false);
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/users/password_reset_confirm/', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setSuccess(response.data.message);
      // Redirect to login after successful password reset
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 3 
        }}
      >
        <Typography component="h1" variant="h5">
          {isRequestMode ? 'Request Password Reset' : 'Reset Your Password'}
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ width: '100%', mt: 2 }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ width: '100%', mt: 2 }}
          >
            {success}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={isRequestMode ? handlePasswordResetRequest : handlePasswordResetConfirm}
          sx={{ width: '100%', mt: 1 }}
        >
          {isRequestMode ? (
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          ) : (
            <>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading 
              ? 'Processing...' 
              : (isRequestMode ? 'Send Reset Link' : 'Reset Password')
            }
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default PasswordReset;
