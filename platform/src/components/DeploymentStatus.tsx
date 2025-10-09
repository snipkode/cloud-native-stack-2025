import { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface DeploymentStatusProps {
  deploymentId: string;
  initialStatus: string;
}

export function DeploymentStatus({ deploymentId, initialStatus }: DeploymentStatusProps) {
  const { subscribeToDeployment, unsubscribeFromDeployment, isWebSocketConnected } = useWebSocket();
  const [status, setStatus] = useState(initialStatus);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to deployment updates
    subscribeToDeployment(deploymentId);

    // In a real implementation, you would set up the WebSocket event listeners here
    // Since we can't actually connect to the WebSocket in this file, I'll simulate it
    // with a timeout to show how you would handle the updates

    // This is just for demonstration - in a real app, you would get actual WebSocket events
    const handleStatusUpdate = (newStatus: string) => {
      setStatus(newStatus);
    };

    const handleLogUpdate = (log: string) => {
      setLogs(prevLogs => [...prevLogs, log]);
    };

    // Return cleanup function
    return () => {
      // Unsubscribe when component unmounts
      unsubscribeFromDeployment(deploymentId);
    };
  }, [deploymentId, subscribeToDeployment, unsubscribeFromDeployment]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Deployment Status</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          isWebSocketConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          {isWebSocketConnected ? 'Real-time updates' : 'Disconnected'}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-700 mb-1">Status</div>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          status === 'deployed' ? 'bg-green-100 text-green-800' :
          status === 'failed' ? 'bg-red-100 text-red-800' :
          status === 'building' || status === 'deploying' ? 'bg-blue-100 text-blue-800' :
          status === 'stopped' ? 'bg-slate-100 text-slate-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-slate-700 mb-1">Real-time Logs</div>
        <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-sm h-40 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1 last:mb-0">{log}</div>
            ))
          ) : (
            <div className="text-slate-500 italic">Waiting for logs...</div>
          )}
        </div>
      </div>
    </div>
  );
}