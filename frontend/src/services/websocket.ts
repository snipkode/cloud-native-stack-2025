import { io, Socket } from 'socket.io-client';



interface ClientToServerEvents {
  'deployment:subscribe': (deploymentId: string) => void;
  'deployment:unsubscribe': (deploymentId: string) => void;
}

// Define the custom events
interface ServerToClientEvents {
  'user:online': (data: { userId: string; status: string; lastActivity?: string }) => void;
  'user:offline': (data: { userId: string; status: string; lastActivity?: string }) => void;
  'deployment:status': (data: { deploymentId: string; status: string; message?: string }) => void;
  'deployment:log': (data: { deploymentId: string; log: string; timestamp: string }) => void;
}

// We don't need to redefine built-in events, Socket type already handles them

export class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnected: boolean = false;
  private connectCallbacks: Array<() => void> = [];
  private disconnectCallbacks: Array<() => void> = [];

  connect(token: string) {
    this.socket = io(import.meta.env.VITE_BASE_URL || 'https://api-v2.obskt.xyz', {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.connectCallbacks.forEach(callback => callback());
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
      this.disconnectCallbacks.forEach(callback => callback());
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.disconnectCallbacks.forEach(callback => callback());
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.disconnectCallbacks.forEach(callback => callback());
    });

    this.socket.on('user:online', (data) => {
      console.log(`User ${data.userId} is now online`);
    });

    this.socket.on('user:offline', (data) => {
      console.log(`User ${data.userId} is now offline`);
    });

    return this.socket;
  }

  onConnect(callback: () => void) {
    this.connectCallbacks.push(callback);
    // If already connected, immediately call the callback
    if (this.isConnected && this.socket?.connected) {
      callback();
    }
  }

  offConnect(callback: () => void) {
    this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback);
  }

  onDisconnect(callback: () => void) {
    this.disconnectCallbacks.push(callback);
  }

  offDisconnect(callback: () => void) {
    this.disconnectCallbacks = this.disconnectCallbacks.filter(cb => cb !== callback);
  }

  isConnectedToWebSocket(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  subscribeToDeployment(deploymentId: string) {
    if (this.socket && this.isConnectedToWebSocket()) {
      this.socket.emit('deployment:subscribe', deploymentId);
    } else {
      console.warn('WebSocket not connected, cannot subscribe to deployment');
    }
  }

  unsubscribeFromDeployment(deploymentId: string) {
    if (this.socket && this.isConnectedToWebSocket()) {
      this.socket.emit('deployment:unsubscribe', deploymentId);
    } else {
      console.warn('WebSocket not connected, cannot unsubscribe from deployment');
    }
  }

  onDeploymentStatus(callback: (data: { deploymentId: string; status: string; message?: string }) => void) {
    if (this.socket) {
      this.socket.on('deployment:status', callback);
    }
  }

  offDeploymentStatus(callback: (data: { deploymentId: string; status: string; message?: string }) => void) {
    if (this.socket) {
      this.socket.off('deployment:status', callback);
    }
  }

  onDeploymentLog(callback: (data: { deploymentId: string; log: string; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.on('deployment:log', callback);
    }
  }

  offDeploymentLog(callback: (data: { deploymentId: string; log: string; timestamp: string }) => void) {
    if (this.socket) {
      this.socket.off('deployment:log', callback);
    }
  }

  onUserOnline(callback: (data: { userId: string; status: string; lastActivity?: string }) => void) {
    if (this.socket) {
      this.socket.on('user:online', callback);
    }
  }

  offUserOnline(callback: (data: { userId: string; status: string; lastActivity?: string }) => void) {
    if (this.socket) {
      this.socket.off('user:online', callback);
    }
  }

  onUserOffline(callback: (data: { userId: string; status: string; lastActivity?: string }) => void) {
    if (this.socket) {
      this.socket.on('user:offline', callback);
    }
  }

  offUserOffline(callback: (data: { userId: string; status: string; lastActivity?: string }) => void) {
    if (this.socket) {
      this.socket.off('user:offline', callback);
    }
  }

  disconnect() {
    if (this.socket && this.isConnectedToWebSocket()) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export const webSocketService = new WebSocketService();