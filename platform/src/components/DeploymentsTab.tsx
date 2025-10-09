import { useState, useEffect } from 'react';
import { Plus, Play, Square, Trash2, ExternalLink, Clock, CheckCircle, XCircle, Loader, Server } from 'lucide-react';
import { Deployment } from '../types/api';
import { apiService } from '../services/api';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation, getNestedTranslation } from '../utils/translations';
import { formatDisplayCurrency } from '../utils/currency';
import { DeploymentModal } from './DeploymentModal';
import { DeploymentLogsModal } from './DeploymentLogsModal';

export function DeploymentsTab() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [logsDeploymentId, setLogsDeploymentId] = useState<string | null>(null);
  const { isWebSocketConnected, subscribeToDeployment, unsubscribeFromDeployment } = useWebSocket();
  const { showNotification } = useNotification();
  const { currency } = useCurrency();
  const { language } = useLanguage();

  useEffect(() => {
    loadDeployments();
  }, []);

  useEffect(() => {
    // Set up WebSocket listeners for deployment updates
    if (isWebSocketConnected) {
      // Subscribe to all existing deployments
      deployments.forEach(deployment => {
        subscribeToDeployment(deployment.id);
      });
    }

    // Cleanup: unsubscribe from all deployments when component unmounts
    return () => {
      deployments.forEach(deployment => {
        unsubscribeFromDeployment(deployment.id);
      });
    };
  }, [deployments, isWebSocketConnected, subscribeToDeployment, unsubscribeFromDeployment]);

  const loadDeployments = async () => {
    try {
      const { deployments } = await apiService.getDeployments();
      setDeployments(deployments);
    } catch (error) {
      console.error('Failed to load deployments:', error);
      showNotification('Failed to load deployments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await apiService.restartDeployment(id);
      loadDeployments();
      showNotification('Deployment restarted successfully', 'success');
    } catch (error) {
      console.error('Failed to restart deployment:', error);
      showNotification('Failed to restart deployment', 'error');
    }
  };

  const handleStop = async (id: string) => {
    try {
      await apiService.stopDeployment(id);
      loadDeployments();
      showNotification('Deployment stopped successfully', 'success');
    } catch (error) {
      console.error('Failed to stop deployment:', error);
      showNotification('Failed to stop deployment', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(getTranslation('areYouSureDeleteDeployment', language))) return;

    try {
      await apiService.deleteDeployment(id);
      loadDeployments();
      showNotification('Deployment deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete deployment:', error);
      showNotification('Failed to delete deployment', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'building':
      case 'deploying':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'stopped':
        return <Square className="w-5 h-5 text-slate-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string, lang: string) => {
    switch (status) {
      case 'deployed':
        return getTranslation('statusDeployed', lang as any);
      case 'failed':
        return getTranslation('statusFailed', lang as any);
      case 'building':
        return getTranslation('statusBuilding', lang as any);
      case 'deploying':
        return getTranslation('statusDeploying', lang as any);
      case 'stopped':
        return getTranslation('statusStopped', lang as any);
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'building':
      case 'deploying':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'stopped':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{getTranslation('deploymentsTitle', language)}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{getTranslation('deploymentsDescription', language)}</p>
        </div>
        <button
          onClick={() => {
            setSelectedDeployment(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{getTranslation('newDeployment', language)}</span>
        </button>
      </div>

      {deployments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Server className="w-16 h-16 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{getTranslation('noDeploymentsYet', language)}</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{getTranslation('getStartedByCreatingFirstDeployment', language)}</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{getTranslation('createDeployment', language)}</span>
          </button>
        </div>
      ) : (
        <div>
          {/* Connection status indicator */}
          <div className="mb-4 flex justify-end">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isWebSocketConnected 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isWebSocketConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {isWebSocketConnected ? 'Real-time updates active' : 'Connecting...'}
            </div>
          </div>
          
          <div className="grid gap-4">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(deployment.status)}
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{deployment.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                        {getStatusLabel(deployment.status, language)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{deployment.repositoryUrl}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Branch: {deployment.branch}</p>
                  </div>
                </div>

                {deployment.appUrl && (
                  <a
                    href={deployment.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1 mb-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{deployment.appUrl}</span>
                  </a>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {getTranslation('cost', language)}: <span className="font-medium">{typeof deployment.cost === 'number' ? formatDisplayCurrency(deployment.cost, currency) : formatDisplayCurrency(0, currency)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setLogsDeploymentId(deployment.id)}
                      className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {getTranslation('viewLogs', language)}
                    </button>
                    {deployment.status === 'stopped' ? (
                      <button
                        onClick={() => handleRestart(deployment.id)}
                        className="px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Play className="w-4 h-4" />
                        <span>{getTranslation('restart', language)}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStop(deployment.id)}
                        className="px-3 py-1.5 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Square className="w-4 h-4" />
                        <span>{getTranslation('stop', language)}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(deployment.id)}
                      className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{getTranslation('deleteDeployment', language)}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <DeploymentModal
          deployment={selectedDeployment}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDeployment(null);
          }}
          onSuccess={() => {
            loadDeployments();
            setIsModalOpen(false);
            setSelectedDeployment(null);
          }}
        />
      )}

      {logsDeploymentId && (
        <DeploymentLogsModal
          deploymentId={logsDeploymentId}
          onClose={() => setLogsDeploymentId(null)}
        />
      )}
    </div>
  );
}
