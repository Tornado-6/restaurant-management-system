import React from 'react';
import { useSelector } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  Restaurant,
  Receipt,
  TableBar,
  TrendingUp,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 40, mr: 2 } })}
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ color }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

function Dashboard() {
  const user = useSelector((state) => state.auth.user);

  // In a real app, these would come from the Redux store
  const stats = {
    totalOrders: 150,
    activeOrders: 12,
    occupiedTables: 8,
    revenue: '$2,500',
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, {user?.first_name}!
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<Receipt />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Orders"
            value={stats.activeOrders}
            icon={<Restaurant />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Occupied Tables"
            value={stats.occupiedTables}
            icon={<TableBar />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Revenue"
            value={stats.revenue}
            icon={<TrendingUp />}
            color="#9c27b0"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Orders
            </Typography>
            {/* Order list component would go here */}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Today's Reservations
            </Typography>
            {/* Reservations list component would go here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
