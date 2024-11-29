import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import websocketService from '../../services/websocket';

const ConnectionStatus = ({ collapsed }) => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleStatusChange = (status) => {
      setConnected(status);
    };

    websocketService.onConnectionStatusChange(handleStatusChange);

    return () => {
      websocketService.offConnectionStatusChange(handleStatusChange);
    };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        height: 64, // Standard MUI AppBar height
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <FiberManualRecordIcon
        sx={{
          color: connected ? 'success.main' : 'error.main',
          fontSize: 12,
        }}
      />
      {!collapsed && (
        <Typography
          sx={{
            fontWeight: 600,
            color: connected ? 'success.main' : 'error.main',
          }}
        >
          {connected ? 'Live' : 'Offline'}
        </Typography>
      )}
    </Box>
  );
};

export default ConnectionStatus;
