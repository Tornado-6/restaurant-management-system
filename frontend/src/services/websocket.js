import { toast } from 'react-toastify';
import store from '../store';  // Import Redux store

class WebSocketService {
  constructor() {
    this.subscribers = new Map();
    this.ws = null;
    this._isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimeout = null;
    this.baseUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000/ws/restaurant/';
    this.statusSubscribers = new Set();
    
    // Bind methods to ensure correct context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.handleReconnect = this.handleReconnect.bind(this);
    this.isConnected = this.isConnected.bind(this);
    this.onConnectionStatusChange = this.onConnectionStatusChange.bind(this);
    this.offConnectionStatusChange = this.offConnectionStatusChange.bind(this);
  }

  _getWebSocketUrl() {
    const state = store.getState();
    const token = state.auth.token || localStorage.getItem('token');

    console.group('🔌 WebSocket URL Generation');
    console.log('Base URL:', this.baseUrl);
    console.log('Token:', token ? '[REDACTED]' : 'No Token');

    if (!token) {
      console.error('No authentication token found');
      console.groupEnd();
      return null;
    }

    if (!navigator.onLine) {
      console.warn('No network connection');
      console.groupEnd();
      return null;
    }

    const encodedToken = encodeURIComponent(token);
    const wsUrl = `${this.baseUrl}?token=${encodedToken}`;
    
    console.log('Generated WebSocket URL:', wsUrl);
    console.groupEnd();

    return wsUrl;
  }

  _logConnectionState(action) {
    console.group('🌐 WebSocket Connection');
    console.log(`Action: ${action}`);
    console.log(`Connected: ${this._isConnected}`);
    console.log(`Reconnect Attempts: ${this.reconnectAttempts}`);
    console.groupEnd();
  }

  _updateConnectionStatus(status) {
    this._isConnected = status;
    this.statusSubscribers.forEach(callback => callback(status));
  }

  onConnectionStatusChange(callback) {
    this.statusSubscribers.add(callback);
    // Immediately call with current status
    callback(this._isConnected);
  }

  offConnectionStatusChange(callback) {
    this.statusSubscribers.delete(callback);
  }

  isConnected() {
    return this._isConnected;
  }

  connect() {
    console.group('🌐 WebSocket Connection Attempt');
    console.log('Current Connection State:', {
      isConnected: this._isConnected,
      reconnectAttempts: this.reconnectAttempts,
      wsState: this.ws?.readyState
    });

    // If already connected, return early
    if (this._isConnected && this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      console.groupEnd();
      return;
    }

    // If we have a pending connection, don't create a new one
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection already in progress');
      console.groupEnd();
      return;
    }

    // Clean up any existing connection
    this.disconnect();

    // Get WebSocket URL
    const wsUrl = this._getWebSocketUrl();
    if (!wsUrl) {
      console.error('Failed to generate WebSocket URL');
      console.groupEnd();
      return;
    }

    try {
      console.log('Initializing new WebSocket connection');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (event) => {
        console.log('WebSocket connection opened');
        this._isConnected = true;
        this._updateConnectionStatus(true);
        this.reconnectAttempts = 0;
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed', event);
        this._isConnected = false;
        this._updateConnectionStatus(false);
        
        // Only attempt to reconnect if it wasn't a clean closure
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this._isConnected = false;
        this._updateConnectionStatus(false);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.broadcastMessage(data);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.handleReconnect();
    }

    console.groupEnd();
  }

  handleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }

    const baseDelay = 1000;
    const maxDelay = 5000;
    const jitter = Math.random() * 1000;
    const delay = Math.min(
      baseDelay * Math.pow(1.5, this.reconnectAttempts) + jitter,
      maxDelay
    );

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  send(type, payload) {
    console.group('📤 WebSocket Send Attempt');
    console.log('Message Type:', type);
    console.log('Payload:', payload);
    console.log('Connection State:', {
      isConnected: this._isConnected,
      wsExists: !!this.ws
    });

    if (!this._isConnected || !this.ws) {
      console.warn(`Cannot send message. WebSocket not connected. Type: ${type}`);
      console.groupEnd();
      return false;
    }

    try {
      this.ws.send(JSON.stringify({
        type: type,
        payload: payload
      }));
      console.log('Message sent successfully');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      console.groupEnd();
      return false;
    }
  }

  disconnect() {
    if (this.ws) {
      // Remove all event handlers before closing
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      this.ws.close();
      this.ws = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this._isConnected = false;
  }

  broadcastMessage(data) {
    // Broadcast message to all subscribers based on message type
    for (const [channel, subscribers] of this.subscribers.entries()) {
      if (data.type === channel) {
        subscribers.forEach(callback => {
          try {
            callback(data.payload);
          } catch (error) {
            console.error(`Error in subscriber for channel ${channel}:`, error);
          }
        });
      }
    }
  }

  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(callback);

    // Attempt to connect if not already connected
    if (!this._isConnected) {
      this.connect();
    }

    // Return an unsubscribe function
    return () => this.unsubscribe(channel, callback);
  }

  unsubscribe(channel, callback) {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.delete(callback);
      
      // If no more subscribers for this channel, consider removing it
      if (channelSubscribers.size === 0) {
        this.subscribers.delete(channel);
      }
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
