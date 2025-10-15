import { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Search, 
  User, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  History, 
  Loader,
  AlertCircle
} from 'lucide-react';
import { User as UserType, Transaction } from '../types/api';
import { CreditHistoryResponse } from '../types/adminCredit';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatDisplayCurrency } from '../utils/currency';

interface AdminCreditPanelProps {
  users: UserType[];
  onUpdate: () => void;
}

export function AdminCreditPanel({ users, onUpdate }: AdminCreditPanelProps) {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [operationType, setOperationType] = useState<'add' | 'subtract' | 'set' | 'reset'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showNotification } = useNotification();
  const { currency } = useCurrency();

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    setCreditHistory(null); // Reset history when changing user
  };

  const handleOperation = async () => {
    if (!selectedUser) {
      showNotification('Please select a user first', 'error');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showNotification('Please enter a valid positive amount', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const numericAmount = parseFloat(amount);

      if (operationType === 'reset') {
        await apiService.resetUserCredit(selectedUser.id, {
          newCreditAmount: numericAmount,
          reason: reason || 'Admin reset credits'
        });
      } else {
        await apiService.updateUserCredit(selectedUser.id, {
          amount: numericAmount,
          type: operationType,
          description: description || `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} credits by admin`
        });
      }

      showNotification(
        `Credits ${operationType === 'add' ? 'added' : operationType === 'subtract' ? 'subtracted' : operationType === 'set' ? 'set' : 'reset'} successfully`,
        'success'
      );
      
      // Refresh user data
      onUpdate();
      
      // Reset form
      setAmount('');
      setDescription('');
      setReason('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update credits';
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCreditHistory = async () => {
    if (!selectedUser) return;

    setIsHistoryLoading(true);
    try {
      const history = await apiService.getUserCreditHistory(selectedUser.id);
      setCreditHistory(history);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load credit history';
      showNotification(errorMessage, 'error');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Load history when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadCreditHistory();
    } else {
      setCreditHistory(null);
    }
  }, [selectedUser]);

  return (
    <div className="space-y-6">
      {/* Search and User Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select User</h3>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedUser?.id === user.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleUserSelect(user)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Credits: {formatDisplayCurrency(user.credits || 0, currency)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Operation Panel */}
      {selectedUser && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Credit Operations for {selectedUser.name}
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Current Credits: {formatDisplayCurrency(selectedUser.credits || 0, currency)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => setOperationType('add')}
              className={`p-3 rounded-lg border transition-colors flex flex-col items-center ${
                operationType === 'add'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-sm">Add</span>
            </button>
            
            <button
              onClick={() => setOperationType('subtract')}
              className={`p-3 rounded-lg border transition-colors flex flex-col items-center ${
                operationType === 'subtract'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Minus className="w-6 h-6 mb-1" />
              <span className="text-sm">Subtract</span>
            </button>
            
            <button
              onClick={() => setOperationType('set')}
              className={`p-3 rounded-lg border transition-colors flex flex-col items-center ${
                operationType === 'set'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <CreditCard className="w-6 h-6 mb-1" />
              <span className="text-sm">Set</span>
            </button>
            
            <button
              onClick={() => setOperationType('reset')}
              className={`p-3 rounded-lg border transition-colors flex flex-col items-center ${
                operationType === 'reset'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <RotateCcw className="w-6 h-6 mb-1" />
              <span className="text-sm">Reset</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount ({operationType === 'reset' ? 'New Amount' : 'Credit Amount'})
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter ${operationType === 'reset' ? 'new' : 'credit'} amount`}
              />
            </div>

            {operationType !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reason for credit adjustment"
                />
              </div>
            )}

            {operationType === 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for credit reset"
                />
              </div>
            )}

            <button
              onClick={handleOperation}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {operationType === 'add' && <Plus className="w-4 h-4 mr-2" />}
                  {operationType === 'subtract' && <Minus className="w-4 h-4 mr-2" />}
                  {operationType === 'set' && <CreditCard className="w-4 h-4 mr-2" />}
                  {operationType === 'reset' && <RotateCcw className="w-4 h-4 mr-2" />}
                  {operationType === 'add' && 'Add Credits'}
                  {operationType === 'subtract' && 'Subtract Credits'}
                  {operationType === 'set' && 'Set Credits'}
                  {operationType === 'reset' && 'Reset Credits'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Credit History */}
      {selectedUser && creditHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <History className="w-5 h-5 mr-2" />
              Credit History
            </h3>
            <button
              onClick={loadCreditHistory}
              disabled={isHistoryLoading}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {isHistoryLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </button>
          </div>

          {isHistoryLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                <div className="col-span-3">Type</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Date</div>
              </div>
              
              {creditHistory.transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No credit history available</p>
                </div>
              ) : (
                creditHistory.transactions.map(transaction => (
                  <div 
                    key={transaction.id} 
                    className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <div className="col-span-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'admin_adjustment' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                          : transaction.type === 'topup'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                    <div className="col-span-2 font-medium">
                      {transaction.type === 'deduction' ? '-' : ''}{formatDisplayCurrency(parseFloat(transaction.amount.toString()), currency)}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    <div className="col-span-3 truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}