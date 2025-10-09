# WebSocket Implementation

## Overview
This document explains how to use the WebSocket functionality in the SaaS/PAAS Platform API for real-time communication, particularly for deployment status updates and user presence tracking.

## WebSocket Base URL
```
wss://api-v2.obskt.xyz
```

## Setup

### Frontend Installation
First, install the Socket.IO client library:
```bash
npm install socket.io-client
```

## Authentication
All WebSocket connections require authentication using a JWT token:

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api-v2.obskt.xyz', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

## Available Events

### Client to Server Events (Emit)
1. **Subscribe to deployment updates**
   ```javascript
   socket.emit('deployment:subscribe', 'deployment-id-here');
   ```

2. **Unsubscribe from deployment updates**
   ```javascript
   socket.emit('deployment:unsubscribe', 'deployment-id-here');
   ```

### Server to Client Events (Listen)
1. **Deployment status updates**
   ```javascript
   socket.on('deployment:status', (data) => {
     console.log(`Deployment ${data.deploymentId} status: ${data.status}`);
   });
   ```

2. **Deployment log updates**
   ```javascript
   socket.on('deployment:log', (data) => {
     console.log(`Deployment ${data.deploymentId} log: ${data.log}`);
   });
   ```

3. **User online status**
   ```javascript
   socket.on('user:online', (data) => {
     console.log(`User ${data.userId} is now ${data.status}`);
   });
   ```

4. **User offline status**
   ```javascript
   socket.on('user:offline', (data) => {
     console.log(`User ${data.userId} is now ${data.status}`);
   });
   ```

## Complete Frontend Example

```javascript
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
  }

  connect(jwtToken) {
    this.socket = io('https://api-v2.obskt.xyz', {
      auth: {
        token: jwtToken
      }
    });

    // Event listeners
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('user:online', (data) => {
      console.log(`User ${data.userId} is now online`);
    });

    this.socket.on('user:offline', (data) => {
      console.log(`User ${data.userId} is now offline`);
    });

    this.socket.on('deployment:status', (data) => {
      console.log(`Deployment ${data.deploymentId} status: ${data.status}`);
      // Update UI based on deployment status
    });

    this.socket.on('deployment:log', (data) => {
      console.log(`Deployment ${data.deploymentId} log: ${data.log}`);
      // Display deployment logs in UI
    });
  }

  // Subscribe to deployment updates
  subscribeToDeployment(deploymentId) {
    if (this.socket) {
      this.socket.emit('deployment:subscribe', deploymentId);
    }
  }

  // Unsubscribe from deployment updates
  unsubscribeFromDeployment(deploymentId) {
    if (this.socket) {
      this.socket.emit('deployment:unsubscribe', deploymentId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage:
const wsService = new WebSocketService();
wsService.connect('your-jwt-token');

// Subscribe to deployment updates
wsService.subscribeToDeployment('some-deployment-id');

// When deployment is complete, unsubscribe
wsService.unsubscribeFromDeployment('some-deployment-id');
```

## React Component Example

```jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const DeploymentStatus = ({ deploymentId, token }) => {
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('https://api-v2.obskt.xyz', {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      newSocket.emit('deployment:subscribe', deploymentId);
    });

    newSocket.on('deployment:status', (data) => {
      setStatus(data.status);
    });

    newSocket.on('deployment:log', (data) => {
      setLogs(prevLogs => [...prevLogs, data.log]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('deployment:unsubscribe', deploymentId);
      newSocket.disconnect();
    };
  }, [deploymentId, token]);

  return (
    <div>
      <h3>Deployment Status: {status}</h3>
      <div className="logs">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default DeploymentStatus;
```

## Important Notes

1. **Authentication Required**: All WebSocket connections must include a valid JWT token in the `auth.token` field
2. **Deployment Tracking**: The system is specifically designed for real-time deployment status tracking
3. **Security**: Although CORS is configured to accept connections from all origins, JWT authentication is still required
4. **User Presence**: The system also tracks real-time user online/offline status

## Error Handling

Always implement proper error handling for WebSocket connections:

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

With this implementation, the frontend can receive real-time updates about deployment statuses and logs, as well as track other users' online/offline status in the system.