import { useState, useEffect } from 'react';
import { Loader, Users, Server, DollarSign, Activity, Shield } from 'lucide-react';
import { User, Deployment, Transaction } from '../types/api';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';
import { AdminUsersPanel } from './AdminUsersPanel';
import { AdminDeploymentsPanel } from './AdminDeploymentsPanel';
import { AdminTransactionsPanel } from './AdminTransactionsPanel';
import { AdminRolesPanel } from './AdminRolesPanel';

type AdminView = 'users' | 'deployments' | 'transactions' | 'roles';

export function AdminTab() {
  const [activeView, setActiveView] = useState<AdminView>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();
  const { currency } = useCurrency();
  const { language } = useLanguage();

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeView) {
        case 'users':
          const usersData = await apiService.getAllUsers();
          setUsers(usersData.users);
          break;
        case 'deployments':
          const deploymentsData = await apiService.getAllDeployments();
          setDeployments(deploymentsData.deployments);
          break;
        case 'transactions':
          const transactionsData = await apiService.getAllTransactions();
          setTransactions(transactionsData.transactions);
          break;
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics for dashboard
  const totalUsers = users.length;
  const totalDeployments = deployments.length;
  const totalTransactions = transactions.length;
  const activeDeployments = deployments.filter(d => d.status === 'deployed').length;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;

  const views = [
    { id: 'users', label: getTranslation('usersTab', language), icon: Users },
    { id: 'deployments', label: getTranslation('deploymentsTab', language), icon: Server },
    { id: 'transactions', label: getTranslation('transactionsTab', language), icon: DollarSign },
    { id: 'roles', label: getTranslation('rolesTab', language), icon: Shield },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{getTranslation('adminPanel', language)}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{getTranslation('manageUsersDeploymentsTransactions', language)}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-lg mr-4">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-300">{getTranslation('totalUsers', language)}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-200 dark:border-green-800/50 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-800/50 rounded-lg mr-4">
              <Server className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-300">{getTranslation('totalDeployments', language)}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalDeployments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800/50 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-800/50 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-300">{getTranslation('totalTransactions', language)}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalTransactions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-5">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg mr-4">
              <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">{getTranslation('activeDeployments', language)}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeDeployments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap border-b-2 ${activeView === view.id
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
                <p className="text-slate-600 dark:text-slate-400">{getTranslation('loading', language)} {getTranslation(activeView === 'users' ? 'usersTab' : activeView === 'deployments' ? 'deploymentsTab' : activeView === 'roles' ? 'rolesTab' : 'transactionsTab', language)}...</p>
              </div>
            </div>
          ) : (
            <>
              {activeView === 'users' && <AdminUsersPanel users={users} onUpdate={loadData} />}
              {activeView === 'deployments' && (
                <AdminDeploymentsPanel deployments={deployments} onUpdate={loadData} currency={currency} />
              )}
              {activeView === 'transactions' && (
                <AdminTransactionsPanel transactions={transactions} onUpdate={loadData} />
              )}
              {activeView === 'roles' && (
                <AdminRolesPanel users={users} onUpdate={loadData} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}