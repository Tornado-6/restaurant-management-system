import websocketService from './websocket';
import store from '../store';

export const testWebSocketConnection = () => {
  // Ensure we have a token
  const state = store.getState();
  const token = state.auth.token || localStorage.getItem('token');

  if (!token) {
    console.error('No authentication token found for WebSocket test');
    return;
  }

  // Subscribe to different channels
  const orderUpdateUnsub = websocketService.subscribe('order_status_update', (payload) => {
    console.log('🔔 Order Status Update Received:', payload);
  });

  const newOrderUnsub = websocketService.subscribe('new_order', (payload) => {
    console.log('🆕 New Order Notification:', payload);
  });

  // Test sending a message
  const testSendMessage = () => {
    const testPayload = {
      message: 'WebSocket connection test',
      timestamp: new Date().toISOString()
    };

    console.log('🚀 Sending test WebSocket message');
    websocketService.send('order_status_update', testPayload);
  };

  // Connect and test
  websocketService.connect();

  // Send test message after a short delay to ensure connection
  setTimeout(testSendMessage, 2000);

  // Return unsubscribe functions for cleanup
  return {
    orderUpdateUnsub,
    newOrderUnsub
  };
};

// Automatically run test when imported
testWebSocketConnection();
