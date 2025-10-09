import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { DeploymentLog } from '../types/api';
import { apiService } from '../services/api';

interface DeploymentLogsModalProps {
  deploymentId: string;
  onClose: () => void;
}

export function DeploymentLogsModal({ deploymentId, onClose }: DeploymentLogsModalProps) {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [deploymentId]);

  const loadLogs = async () => {
    try {
      const { logs } = await apiService.getDeploymentLogs(deploymentId);
      setLogs(logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'build':
      case 'deploy':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Deployment Logs</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No logs available</div>
          ) : (
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
              {logs.map((log) => (
                <div key={log.id} className="mb-2">
                  <span className="text-slate-400">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  <span className={getLogColor(log.type)}>[{log.type.toUpperCase()}]</span>{' '}
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
