import { useState } from 'react';
import { User as UserIcon, Mail, Shield, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

export function ProfileTab() {
  const { user, refreshProfile } = useAuth();
  const { showNotification } = useNotification();
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [status, setStatus] = useState(user?.status || 'offline');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiService.updateProfile({ name, status });
      await refreshProfile();
      showNotification('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{getTranslation('profileSettings', language)}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{getTranslation('profileManageAccountInformation', language)}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex items-end space-x-4 -mt-16">
            <div className="w-32 h-32 bg-white dark:bg-slate-700 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
              <UserIcon className="w-16 h-16 text-slate-400 dark:text-slate-300" />
            </div>
            <div className="flex-1 pt-4">
              {!isEditing ? (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'online'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : user.status === 'away'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {user.status === 'online' 
                        ? getTranslation('profileOnline', language) 
                        : user.status === 'away' 
                          ? getTranslation('profileAway', language) 
                          : getTranslation('profileOffline', language)}
                    </span>
                    {user.role === 'admin' && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                        <Shield className="w-3 h-3 inline mr-1" />
                        {getTranslation('profileAdmin', language)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder={getTranslation('profileYourName', language)}
                  />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="online">{getTranslation('profileOnline', language)}</option>
                    <option value="away">{getTranslation('profileAway', language)}</option>
                    <option value="offline">{getTranslation('profileOffline', language)}</option>
                  </select>
                </div>
              )}
            </div>
            <div className="pt-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {getTranslation('profileEdit', language)}
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? getTranslation('profileSaving', language) : getTranslation('profileSave', language)}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                      setStatus(user.status);
                    }}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {getTranslation('profileCancel', language)}
                  </button>
                </div>
              )}
            </div>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{getTranslation('profileEmail', language)}</div>
                <div className="text-slate-900 dark:text-white">{user.email}</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{getTranslation('profileMemberSince', language)}</div>
                <div className="text-slate-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{getTranslation('profileLastActivity', language)}</div>
                <div className="text-slate-900 dark:text-white">
                  {new Date(user.lastActivity).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <UserIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{getTranslation('profileUserId', language)}</div>
                <div className="text-slate-900 dark:text-white font-mono text-xs">{user.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
