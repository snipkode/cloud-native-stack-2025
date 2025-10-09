import { useState } from 'react';
import { Trash2, ExternalLink, Edit3, Square, RefreshCw } from 'lucide-react';
import { Deployment } from '../types/api';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { formatDisplayCurrency } from '../utils/currency';
import { CurrencyType } from '../utils/currency';

interface AdminDeploymentsPanelProps {
  deployments: Deployment[];
  onUpdate: () => void;
  currency?: CurrencyType;
}

export function AdminDeploymentsPanel({ deployments, onUpdate, currency = 'IDR' }: AdminDeploymentsPanelProps) {
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null);
  const [formData, setFormData] = useState<Partial<Deployment>>({});
  const { showNotification } = useNotification();
  
  const handleDelete = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to delete this deployment? This action cannot be undone.')) return;

    try {
      await apiService.deleteDeploymentAdmin(deploymentId);
      onUpdate();
      showNotification('Deployment deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete deployment:', error);
      showNotification('Failed to delete deployment', 'error');
    }
  };

  const handleRestart = async (deploymentId: string) => {
    try {
      await apiService.restartDeployment(deploymentId);
      onUpdate();
      showNotification('Deployment restarted successfully', 'success');
    } catch (error) {
      console.error('Failed to restart deployment:', error);
      showNotification('Failed to restart deployment', 'error');
    }
  };

  const handleStop = async (deploymentId: string) => {
    try {
      await apiService.stopDeployment(deploymentId);
      onUpdate();
      showNotification('Deployment stopped successfully', 'success');
    } catch (error) {
      console.error('Failed to stop deployment:', error);
      showNotification('Failed to stop deployment', 'error');
    }
  };

  const handleEdit = (deployment: Deployment) => {
    setEditingDeployment(deployment);
    setFormData({
      name: deployment.name,
      repositoryUrl: deployment.repositoryUrl,
      branch: deployment.branch,
      cost: deployment.cost,
      // Include environment variables if needed
      envVars: deployment.envVars
    });
  };

  const handleSave = async () => {
    if (!editingDeployment) return;

    try {
      await apiService.updateDeploymentAdmin(editingDeployment.id, formData);
      setEditingDeployment(null);
      setFormData({});
      onUpdate();
      showNotification('Deployment updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update deployment:', error);
      showNotification('Failed to update deployment', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'building':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'deploying':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'stopped':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return '✅';
      case 'failed':
        return '❌';
      case 'building':
        return '🔨';
      case 'deploying':
        return '🚀';
      case 'stopped':
        return '🛑';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {deployments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-lg">No deployments found</div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">There are no deployments to show.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deployments.map((deployment) => (
            <div 
              key={deployment.id} 
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
            >
              {editingDeployment?.id === deployment.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Repository URL</label>
                    <input
                      type="text"
                      value={formData.repositoryUrl}
                      onChange={(e) => setFormData({...formData, repositoryUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Branch</label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({...formData, branch: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDeployment(null)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg" title={status}>{getStatusIcon(deployment.status)}</span>
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{deployment.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deployment.status)}`}>
                          {deployment.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p className="text-slate-600 dark:text-slate-400 truncate" title={deployment.repositoryUrl}>
                          {deployment.repositoryUrl}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Branch: {deployment.branch}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          Cost: {typeof deployment.cost === 'number' ? formatDisplayCurrency(deployment.cost, currency || 'IDR') : formatDisplayCurrency(0, currency || 'IDR')}
                        </p>
                      </div>
                      
                      {deployment.appUrl && (
                        <a
                          href={deployment.appUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1 mt-2 truncate"
                        >
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{deployment.appUrl}</span>
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={() => handleEdit(deployment)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit deployment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRestart(deployment.id)}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Restart deployment"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {deployment.status !== 'stopped' && (
                        <button
                          onClick={() => handleStop(deployment.id)}
                          className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Stop deployment"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(deployment.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Delete deployment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
