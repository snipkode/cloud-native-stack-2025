import { useState, useEffect } from 'react';
import { Plus, Loader, CreditCard, TrendingUp, TrendingDown, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Transaction, Plan } from '../types/api';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation, getNestedTranslation, translations } from '../utils/translations';
import { formatDisplayCurrency } from '../utils/currency';

declare global {
  interface Window {
    snap: any;
  }
}

export function BillingTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminCreditTotal, setAdminCreditTotal] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlan, setUserPlan] = useState<Plan | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { showNotification } = useNotification();
  const { currency } = useCurrency();
  const { language } = useLanguage();

  useEffect(() => {
    loadTransactions();
    loadPlans();
    loadUserPlan();
    if (user?.role === 'admin') {
      // Load admin-specific data
      loadAdminCreditTotal();
    }
  }, [user]);

  const loadAdminCreditTotal = async () => {
    try {
      // For admin, get all users and sum up their credits
      const response = await apiService.getAllUsers();
      const allUsers = response.users;
      
      // Calculate total credits across all users
      const totalCredits = allUsers.reduce((sum, usr) => sum + (usr.credits || 0), 0);
      
      setAdminCreditTotal(totalCredits);
    } catch (error) {
      console.error('Failed to load admin credit total:', error);
      // Fallback to 0 if there's an error
      setAdminCreditTotal(0);
    }
  };

  const loadTransactions = async () => {
    try {
      const { transactions } = await apiService.getTransactions();
      setTransactions(transactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await apiService.getPlans();
      setPlans(response.plans);
    } catch (error) {
      console.error('Failed to load plans:', error);
      showNotification('Failed to load plans', 'error');
    }
  };

  const loadUserPlan = async () => {
    try {
      const response = await apiService.getMyPlan();
      setUserPlan(response.plan);
    } catch (error) {
      console.error('Failed to load user plan:', error);
      // User might not have a plan yet, which is fine
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // For non-Midtrans methods, process as usual
      if (paymentMethod !== 'midtrans') {
        // Send the amount directly in IDR to the API
        const idrAmount = parseFloat(amount);
        
        await apiService.createTransaction({
          type: 'topup',
          amount: idrAmount,
          paymentMethod,
        });
        setIsModalOpen(false);
        setAmount('');
        loadTransactions();
        refreshProfile();
        showNotification('Credits added successfully!', 'success');
      }
      // For Midtrans, we'll handle the payment flow differently
      // The actual payment processing will be handled by the MidtransPayment component
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      showNotification(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribeToPlan = async (planId: string) => {
    if (!window.confirm(`Are you sure you want to subscribe to the ${plans.find(p => p.id === planId)?.name} plan?`)) {
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await apiService.subscribeToPlan(planId);
      
      // Redirect to payment page
      window.location.href = response.paymentUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to plan';
      showNotification(errorMessage, 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  const getTransactionTypeLabel = (type: string, lang: string) => {
    switch (type) {
      case 'topup':
        return getTranslation('transactionTopup', lang as any);
      case 'subscription':
        return getTranslation('transactionSubscription', lang as any);
      default:
        return type;
    }
  };

  const getTransactionStatusLabel = (status: string, lang: string) => {
    switch (status) {
      case 'completed':
        return getTranslation('statusCompleted', lang as any);
      case 'failed':
        return getTranslation('statusFailed', lang as any);
      case 'cancelled':
        return getTranslation('statusCancelled', lang as any);
      case 'pending':
        return getTranslation('statusPending', lang as any);
      default:
        return status;
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
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{getTranslation('billingTitle', language)}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{getTranslation('billingDescription', language)}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{getTranslation('addCredits', language)}</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <CreditCard className="w-6 h-6" />
          <h2 className="text-lg font-semibold">{getTranslation('availableCredits', language)}</h2>
        </div>
        <div className="text-4xl font-bold">
          {user?.role === 'admin' 
            ? (adminCreditTotal !== null ? formatDisplayCurrency(adminCreditTotal, currency) : 'Loading...') 
            : (user && typeof user.credits === 'number' ? formatDisplayCurrency(user.credits, currency) : currency === 'IDR' ? 'IDR 0' : '$0.00')}
        </div>
        {user?.role === 'admin' && (
          <p className="text-sm mt-1 opacity-80">Admin view: Total across all users</p>
        )}
      </div>

      {/* Plan Subscription Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">{getTranslation('yourPlan', language)}</h3>
        </div>
        <div className="p-6">
          {userPlan ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">{userPlan.name} {getTranslation('subscription', language)}</h4>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatDisplayCurrency(userPlan.price, currency)}
                </span>
              </div>
              <ul className="space-y-2 mb-4">
                {userPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {getTranslation('apps', language)}: {userPlan.limits.apps}, {getTranslation('storage', language)}: {userPlan.limits.storage}GB, 
                {getTranslation('ram', language)}: {userPlan.limits.ram}MB, {getTranslation('cpu', language)}: {userPlan.limits.cpu}
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{getTranslation('noPlanSelected', language)}</h4>
              <p className="text-slate-600 dark:text-slate-300 mb-4">{getTranslation('subscribeToPlan', language)} to get started with our services.</p>
            </div>
          )}

          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{getTranslation('availablePlans', language)}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = userPlan?.id === plan.id;
              return (
                <div 
                  key={plan.id} 
                  className={`border rounded-lg p-4 ${
                    isCurrentPlan 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-slate-900 dark:text-white">{plan.name}</h5>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatDisplayCurrency(plan.price, currency)}/mo
                    </span>
                  </div>
                  <ul className="space-y-1 mb-4 text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <button 
                      className="w-full py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg font-medium cursor-not-allowed"
                      disabled
                    >
                      {getTranslation('currentPlan', language)}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSubscribeToPlan(plan.id)}
                      disabled={isSubscribing}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                    >
                      {isSubscribing ? getTranslation('loading', language) : getTranslation('subscribeToPlan', language)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">{getTranslation('transactionHistory', language)}</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            {getTranslation('noTransactionsYet', language)}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${transaction.type === 'topup' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {transaction.type === 'topup' ? (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white capitalize">
                      {getTransactionTypeLabel(transaction.type, language)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {getTransactionStatusLabel(transaction.status, language)}
                  </span>
                  <div className={`text-lg font-semibold ${transaction.type === 'topup' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {transaction.type === 'topup' ? '+' : '-'}{typeof transaction.amount === 'number' ? formatDisplayCurrency(transaction.amount, currency) : currency === 'IDR' ? 'IDR 0' : '$0.00'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-slate-900 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getTranslation('addCredits', language)}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUp} className="p-6 space-y-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {getTranslation('amountIdr', language)}
                </label>
                <input
                  id="amount"
                  type="number"
                  step="100"
                  min="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="50000"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{getTranslation('minimumAmount', language)}</p>
              </div>

              <div>
                <label htmlFor="payment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {getTranslation('paymentMethod', language)}
                </label>
                <select
                  id="payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="midtrans">
                    {getNestedTranslation(translations, 'paymentMethods.midtrans', language)}
                  </option>
                  <option value="card">
                    {getNestedTranslation(translations, 'paymentMethods.card', language)}
                  </option>
                  <option value="paypal">
                    {getNestedTranslation(translations, 'paymentMethods.paypal', language)}
                  </option>
                  <option value="crypto">
                    {getNestedTranslation(translations, 'paymentMethods.crypto', language)}
                  </option>
                </select>
              </div>



              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {getTranslation('cancel', language)}
                </button>
                {paymentMethod === 'midtrans' ? (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={async () => {
                      setIsProcessing(true);

                      try {
                        // Send the amount directly in IDR to the API
                        const idrAmount = parseFloat(amount);
                        
                        // Call backend to create transaction and get Snap token
                        const response = await apiService.createTransaction({
                          type: 'topup',
                          amount: idrAmount,
                          paymentMethod,
                        });
                        
                        // Get the Snap token from the transaction or from a separate endpoint
                        // For now, we'll simulate this by calling a Midtrans Snap instance
                        // In a real-world scenario, you'd have an endpoint that returns the token
                        const snapToken = response.transaction.paymentGatewayId || 'dummy-token';
                        
                        // Use Midtrans Snap to open the payment page
                        if (window.snap) {
                          window.snap.show({
                            token: snapToken,
                            onSuccess: async (result: any) => {
                              console.log('Payment success:', result);
                              // Update transaction status after success
                              try {
                                // Refresh data after successful payment
                                loadTransactions();
                                refreshProfile();
                                setIsModalOpen(false);
                                setAmount('');
                                showNotification('Payment successful!', 'success');
                              } catch (err) {
                                const errorMessage = err instanceof Error ? err.message : 'Error updating transaction status';
                                showNotification(errorMessage, 'error');
                              }
                            },
                            onPending: (result: any) => {
                              console.log('Payment pending:', result);
                              // Transaction is pending, we can close modal and user can check status later
                              loadTransactions();
                              refreshProfile();
                              setIsModalOpen(false);
                              setAmount('');
                              showNotification('Payment is pending, please check back later', 'info');
                            },
                            onError: (result: any) => {
                              console.log('Payment error:', result);
                              showNotification('Payment failed. Please try again.', 'error');
                            },
                            onClose: () => {
                              console.log('Customer closed the popup without finishing the payment');
                              showNotification('Payment was cancelled', 'info');
                            }
                          });
                        } else {
                          // Fallback: if window.snap is not available
                          console.log('Midtrans Snap is not available');
                          showNotification('Payment gateway is temporarily unavailable. Please try again later.', 'error');
                        }
                      } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
                        showNotification(errorMessage, 'error');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? getTranslation('loading', language) : 'Pay with Midtrans'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? getTranslation('loading', language) : getTranslation('addCredits', language)}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
