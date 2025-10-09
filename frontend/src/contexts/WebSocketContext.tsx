import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

interface WebSocketContextType {
  isWebSocketConnected: boolean;
  subscribeToDeployment: (deploymentId: string) => void;
  unsubscribeFromDeployment: (deploymentId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  useEffect(() => {
    // Update connection status when WebSocket events occur
    const handleConnect = () => setIsWebSocketConnected(true);
    const handleDisconnect = () => setIsWebSocketConnected(false);

    // Register connection event listeners
    webSocketService.onConnect(handleConnect);
    webSocketService.onDisconnect(handleDisconnect);
    
    // Initial connection status
    setIsWebSocketConnected(webSocketService.isConnectedToWebSocket());

    return () => {
      // Cleanup event listeners
      webSocketService.offConnect(handleConnect);
      webSocketService.offDisconnect(handleDisconnect);
    };
  }, []);

  const subscribeToDeployment = (deploymentId: string) => {
    webSocketService.subscribeToDeployment(deploymentId);
  };

  const unsubscribeFromDeployment = (deploymentId: string) => {
    webSocketService.unsubscribeFromDeployment(deploymentId);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isWebSocketConnected,
        subscribeToDeployment,
        unsubscribeFromDeployment,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}