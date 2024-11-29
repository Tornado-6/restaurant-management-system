import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  ListItemButton,
  Collapse,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as ShoppingCartIcon,
  EventSeat,
  Inventory as InventoryIcon,
  MenuBook,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import ConnectionStatus from '../common/ConnectionStatus';

const drawerWidth = 240;

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard',
    roles: ['admin', 'manager', 'waiter', 'chef', 'kitchen_staff']
  },
  { 
    text: 'Orders', 
    icon: <ShoppingCartIcon />, 
    path: '/orders',
    roles: ['admin', 'manager', 'waiter'] 
  },
  { 
    text: 'Kitchen', 
    icon: <RestaurantIcon />, 
    path: '/kitchen', 
    roles: ['admin', 'manager', 'chef', 'kitchen_staff'],
    children: [
      { 
        text: 'Kitchen Display', 
        icon: <DashboardIcon />, 
        path: '/kitchen/display', 
        roles: ['chef', 'kitchen_staff'] 
      },
      { 
        text: 'Menu Items', 
        icon: <MenuBook />, 
        path: '/kitchen/menu-items',
        roles: ['admin', 'manager', 'chef']
      },
      { 
        text: 'Inventory', 
        icon: <InventoryIcon />, 
        path: '/kitchen/inventory',
        roles: ['admin', 'manager'] 
      }
    ] 
  },
  { 
    text: 'Tables', 
    icon: <EventSeat />, 
    path: '/tables',
    roles: ['admin', 'manager', 'waiter']
  },
  { 
    text: 'Reservations', 
    icon: <EventSeat />, 
    path: '/tables/reservations',
    roles: ['admin', 'manager', 'waiter']
  },
  { 
    text: 'Users', 
    icon: <GroupIcon />, 
    path: '/users', 
    roles: ['admin'] 
  },
  { 
    text: 'Audit Logs', 
    icon: <AssessmentIcon />, 
    path: '/audit-logs', 
    roles: ['admin', 'manager'] 
  },
];

function Layout() {
  const [open, setOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleDrawerToggle = () => {
    setOpen(!open);
    // Close all expanded items when closing drawer
    if (open) {
      setExpandedItems({});
    }
  };

  const handleMenuClick = (item) => {
    if (item.children) {
      // If drawer is closed and item has children, open the drawer first
      if (!open) {
        setOpen(true);
      }
      setExpandedItems(prev => ({
        ...prev,
        [item.path]: !prev[item.path]
      }));
    } else {
      navigate(item.path);
      setSelectedItem(item.path);
      // Close drawer on mobile after selection
      if (window.innerWidth < 600) {
        setOpen(false);
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const checkRoleAccess = (requiredRoles, userRoles) => {
    // Normalize roles to lowercase arrays
    const normalizedRequiredRoles = requiredRoles.map(role => role.toLowerCase());
    const normalizedUserRoles = (userRoles || [])
      .map(role => (role || '').toLowerCase())
      .filter(role => role); // Remove empty roles

    console.group('🔐 Role Access Check');
    console.log('Required Roles:', normalizedRequiredRoles);
    console.log('User Roles:', normalizedUserRoles);

    // Check if any required role matches user roles
    const hasAccess = normalizedRequiredRoles.some(requiredRole => 
      normalizedUserRoles.includes(requiredRole)
    );

    console.log('Access Granted:', hasAccess);
    console.groupEnd();

    return hasAccess;
  };

  const renderMenuItems = (items, level = 0) => {
    // Extract user roles, supporting multiple formats
    const userRoles = user?.roles 
      ? (Array.isArray(user.roles) ? user.roles : [user.roles])
      : (user?.role ? [user.role] : []);

    return items.filter(item => {
      // Always show items with no role restrictions
      if (!item.roles || item.roles.length === 0) return true;

      // Require login for role-restricted items
      if (!user) return false;

      // Check role access
      return checkRoleAccess(item.roles, userRoles);
    }).map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems[item.path];
      const isSelected = !hasChildren && selectedItem === item.path;

      return (
        <React.Fragment key={item.text}>
          <ListItem 
            disablePadding 
            sx={{ 
              display: 'block',
              pl: level * 2
            }}
          >
            <ListItemButton
              onClick={() => handleMenuClick(item)}
              selected={isSelected}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: '0 20px 20px 0',
                mr: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ opacity: open ? 1 : 0 }} 
              />
              {hasChildren && open && (
                isExpanded ? <ExpandLess /> : <ExpandMore />
              )}
            </ListItemButton>
          </ListItem>
          
          {hasChildren && isExpanded && open && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderMenuItems(item.children, level + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'background.paper',
          color: 'text.primary',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Restaurant Management System
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            overflowX: 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            width: open ? drawerWidth : theme => ({
              xs: '0px',
              sm: theme.spacing(7),
            }),
          },
        }}
        open={open}
      >
        <Toolbar />
        <List>
          {renderMenuItems(menuItems)}
        </List>
        <Box sx={{ position: 'fixed', bottom: 0, width: open ? drawerWidth : 56 }}>
          <ConnectionStatus collapsed={!open} />
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
