import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import api from '../../services/api';
import { format } from 'date-fns';

const ACTION_TYPES = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'password_change', label: 'Password Change' },
];

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    action: '',
    startDate: null,
    endDate: null,
    search: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/audit/logs/';
      const params = new URLSearchParams();

      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('start_date', filters.startDate.toISOString());
      if (filters.endDate) params.append('end_date', filters.endDate.toISOString());
      if (filters.search) params.append('search', filters.search);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target ? event.target.value : event
    }));
    setPage(0);
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Audit Logs</Typography>
        <IconButton onClick={fetchLogs} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Action Type"
              value={filters.action}
              onChange={handleFilterChange('action')}
            >
              <MenuItem value="">All Actions</MenuItem>
              {ACTION_TYPES.map((action) => (
                <MenuItem key={action.value} value={action.value}>
                  {action.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(newValue) => {
                  setFilters(prev => ({ ...prev, startDate: newValue }));
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(newValue) => {
                  setFilters(prev => ({ ...prev, endDate: newValue }));
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.search}
              onChange={handleFilterChange('search')}
              placeholder="Search users, IP..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(loading ? [] : logs)
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.timestamp), 'PPpp')}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.action} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{log.ip_address}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.status} 
                      size="small"
                      color={getStatusColor(log.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={JSON.stringify(log.details, null, 2)}>
                      <IconButton size="small">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No audit logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
}

export default AuditLogs;
