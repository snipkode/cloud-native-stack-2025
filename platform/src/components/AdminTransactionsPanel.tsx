import { useState } from 'react';
import { TrendingUp, TrendingDown, Edit3, Search, Calendar } from 'lucide-react';
import { Transaction } from '../types/api';
import { formatDisplayCurrency } from '../utils/currency';
import { apiService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface AdminTransactionsPanelProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

export function AdminTransactionsPanel({ transactions, onUpdate }: AdminTransactionsPanelProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { showNotification } = useNotification();
  
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSave = async () => {
    if (!editingTransaction) return;
    
    try {
      await apiService.updateTransaction(editingTransaction.id, {
        amount: editingTransaction.amount,
        status: editingTransaction.status,
        type: editingTransaction.type,
        paymentMethod: editingTransaction.paymentMethod
      });
      setEditingTransaction(null);
      onUpdate();
      showNotification('Transaction updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update transaction:', error);
      showNotification('Failed to update transaction', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'cancelled':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'topup' 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
  };

  // Filter and search transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesSearch = searchTerm === '' || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.paymentMethod && transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())) ||
      formatDisplayCurrency(transaction.amount).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="topup">Top-up</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 text-lg">No transactions found</div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {searchTerm || filterType !== 'all' 
              ? 'Try changing your search or filter criteria.' 
              : 'There are no transactions to show.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
            >
              {editingTransaction?.id === transaction.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                      <input
                        type="number"
                        value={editingTransaction.amount}
                        onChange={(e) => setEditingTransaction({
                          ...editingTransaction, 
                          amount: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                      <select
                        value={editingTransaction.type}
                        onChange={(e) => setEditingTransaction({
                          ...editingTransaction, 
                          type: e.target.value as 'topup' | 'deduction'
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                      >
                        <option value="topup">Top-up</option>
                        <option value="deduction">Deduction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                      <select
                        value={editingTransaction.status}
                        onChange={(e) => setEditingTransaction({
                          ...editingTransaction, 
                          status: e.target.value as 'pending' | 'completed' | 'failed' | 'cancelled'
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                      <input
                        type="text"
                        value={editingTransaction.paymentMethod || ''}
                        onChange={(e) => setEditingTransaction({
                          ...editingTransaction, 
                          paymentMethod: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingTransaction(null)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-lg ${getTypeColor(transaction.type)}`}>
                      {transaction.type === 'topup' ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : (
                        <TrendingDown className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                        {transaction.paymentMethod && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {transaction.paymentMethod}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">
                        ID: {transaction.id}
                      </p>
                      
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                          {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                    <div className={`text-xl font-bold ${transaction.type === 'topup' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.type === 'topup' ? '+' : '-'}{typeof transaction.amount === 'number' ? formatDisplayCurrency(transaction.amount) : 'IDR 0'}
                    </div>
                    
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit transaction"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Summary section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4">
          <div className="text-green-800 dark:text-green-200 font-medium">Top-ups</div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-100 mt-1">
            {formatDisplayCurrency(
              transactions
                .filter(t => t.type === 'topup' && t.status === 'completed')
                .reduce((sum, t) => sum + (t.amount || 0), 0)
            )}
          </div>
          <div className="text-green-700 dark:text-green-300 text-sm mt-1">
            {transactions.filter(t => t.type === 'topup' && t.status === 'completed').length} transactions
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
          <div className="text-red-800 dark:text-red-200 font-medium">Deductions</div>
          <div className="text-2xl font-bold text-red-800 dark:text-red-100 mt-1">
            {formatDisplayCurrency(
              transactions
                .filter(t => t.type === 'deduction' && t.status === 'completed')
                .reduce((sum, t) => sum + (t.amount || 0), 0)
            )}
          </div>
          <div className="text-red-700 dark:text-red-300 text-sm mt-1">
            {transactions.filter(t => t.type === 'deduction' && t.status === 'completed').length} transactions
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
          <div className="text-blue-800 dark:text-blue-200 font-medium">Net Change</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-100 mt-1">
            {formatDisplayCurrency(
              transactions
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => {
                  return t.type === 'topup' 
                    ? sum + (t.amount || 0) 
                    : sum - (t.amount || 0);
                }, 0)
            )}
          </div>
          <div className="text-blue-700 dark:text-blue-300 text-sm mt-1">
            {transactions.filter(t => t.status === 'completed').length} total transactions
          </div>
        </div>
      </div>
    </div>
  );
}
