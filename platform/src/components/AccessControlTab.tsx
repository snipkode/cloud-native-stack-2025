import { useState, useEffect } from 'react';
import { Plus, Loader, Shield, Trash2, X } from 'lucide-react';
import { AccessGrant, User } from '../types/api';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

export function AccessControlTab() {
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    resourceType: 'deployment' as const,
    resourceId: '',
    permissions: '',
    expiresAt: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { showNotification } = useNotification();
  const { language } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [grantsData, usersData] = await Promise.all([
        apiService.getAccessGrants(),
        apiService.getAllUsers(),
      ]);
      setAccessGrants(grantsData.accessGrants);
      setUsers(usersData.users);
    } catch (error) {
      console.error('Failed to load access control data:', error);
      showNotification('Failed to load access control data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await apiService.grantAccess({
        userId: formData.userId,
        resourceType: formData.resourceType,
        resourceId: formData.resourceId || undefined,
        permissions: formData.permissions.split(',').map((p) => p.trim()).filter(Boolean),
        expiresAt: formData.expiresAt || undefined,
      });
      setIsModalOpen(false);
      setFormData({
        userId: '',
        resourceType: 'deployment',
        resourceId: '',
        permissions: '',
        expiresAt: '',
      });
      loadData();
      showNotification('Access granted successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      showNotification(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async (grantId: string) => {
    if (!confirm(getTranslation('areYouSureRevokeAccess', language))) return;

    try {
      await apiService.revokeAccess(grantId);
      loadData();
      showNotification('Access revoked successfully', 'success');
    } catch (error) {
      console.error('Failed to revoke access:', error);
      showNotification('Failed to revoke access', 'error');
    }
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || 'Unknown User';
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{getTranslation('accessControl', language)}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{getTranslation('manageFineGrainedAccessPermissions', language)}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{getTranslation('grantAccess', language)}</span>
        </button>
      </div>

      {accessGrants.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Shield className="w-16 h-16 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{getTranslation('noAccessGrantsYet', language)}</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{getTranslation('createGranularAccessPermissions', language)}</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{getTranslation('grantAccess', language)}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {accessGrants.map((grant) => (
            <div key={grant.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">{getUserName(grant.userId)}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-medium">{getTranslation('resource', language)}:</span>{' '}
                      <span className="capitalize">{getTranslation(grant.resourceType + 'Resource', language)}</span>
                      {grant.resourceId && ` (${grant.resourceId.slice(0, 8)}...)`}
                    </p>
                    <p>
                      <span className="font-medium">{getTranslation('permissions', language)}:</span> {grant.permissions.join(', ')}
                    </p>
                    {grant.expiresAt && (
                      <p>
                        <span className="font-medium">{getTranslation('expires', language)}:</span>{' '}
                        {new Date(grant.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {getTranslation('granted', language)} {new Date(grant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(grant.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-slate-900 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getTranslation('grantAccess', language)}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantAccess} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{getTranslation('user', language)}</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{getTranslation('resourceType', language)}</label>
                <select
                  value={formData.resourceType}
                  onChange={(e) => setFormData({ ...formData, resourceType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="deployment">{getTranslation('deploymentResource', language)}</option>
                  <option value="billing">{getTranslation('billingResource', language)}</option>
                  <option value="user">{getTranslation('userResource', language)}</option>
                  <option value="system">{getTranslation('systemResource', language)}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {getTranslation('resourceIdOptional', language)}
                </label>
                <input
                  type="text"
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder={getTranslation('specificResourceId', language)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {getTranslation('permissionsCommaSeparated', language)}
                </label>
                <input
                  type="text"
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder={getTranslation('examplePermissions', language)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {getTranslation('expiresAtOptional', language)}
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>



              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {getTranslation('cancel', language)}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? getTranslation('loading', language) + '...' : getTranslation('grantAccess', language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
