import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const { isWebSocketConnected } = useWebSocket();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors([]);
    setIsLoading(true);

    // Validation only for registration
    if (!isLogin) {
      const validationErrors = [];
      
      // Check if confirm password field has an invalid value (empty)
      if (!confirmPassword) {
        validationErrors.push({
          field: "confirmPassword",
          message: "Invalid value"
        });
      }
      
      // Check if passwords don't match (always check if both have values, but can also match the example scenario)
      if (password !== confirmPassword) {
        validationErrors.push({
          field: "confirmPassword",
          message: "Passwords do not match"
        });
      }
      
      if (password.length < 6) {
        validationErrors.push({
          field: "password",
          message: "Password must be at least 6 characters"
        });
      }
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        await login(email, password);
        showNotification('Login successful!', 'success');
      } else {
        await register(email, password, name, confirmPassword);
        showNotification('Registration successful!', 'success');
      }

      // Check for return URL from protected route
      const from = location.state?.from || '/';
      // Check if there's a selected plan from the landing page
      const selectedPlanId = localStorage.getItem('selectedPlanId');
      if (selectedPlanId) {
        // Navigate to billing tab to select the plan
        navigate('/dashboard?tab=billing');
        // Clear the selected plan from localStorage
        localStorage.removeItem('selectedPlanId');
      } else if (from && from !== '/') {
        // Navigate back to the protected route that was initially accessed
        navigate(from);
      } else {
        // Navigate to dashboard after successful login/registration
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        // Check if this is an API error with validation details
        try {
          // Check if the error message is a JSON string containing validation details
          const errorObj = JSON.parse(err.message);
          if (errorObj.error === "Validation failed" && Array.isArray(errorObj.details)) {
            setErrors(errorObj.details);
            // Don't show popup anymore, errors will be displayed inline
          } else {
            setError(err.message);
            showNotification(err.message, 'error');
          }
        } catch {
          // If it's not a JSON error, handle as before
          setError(err.message);
          showNotification(err.message, 'error');
        }
      } else {
        setError('An error occurred');
        showNotification('An error occurred', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-slate-700 dark:text-white"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 border ${errors.some(e => e.field === "email") ? 'border-red-500' : 'border-slate-300'} dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-slate-700 dark:text-white`}
                placeholder="you@example.com"
              />
              {errors.some(e => e.field === "email") && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.find(e => e.field === "email")?.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 pr-12 border ${errors.some(e => e.field === "password") ? 'border-red-500' : 'border-slate-300'} dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-slate-700 dark:text-white`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.some(e => e.field === "password") && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.find(e => e.field === "password")?.message}
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                    className={`w-full px-4 py-3 pr-12 border ${errors.some(e => e.field === "confirmPassword") ? 'border-red-500' : 'border-slate-300'} dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-slate-700 dark:text-white`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.some(e => e.field === "confirmPassword") && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.find(e => e.field === "confirmPassword")?.message}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {error && (
            <div className="mt-4 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* WebSocket Connection Status */}
          <div className="mt-4 text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isWebSocketConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isWebSocketConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              {isWebSocketConnected ? 'Real-time connected' : 'Connecting...'}
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setErrors([]);
                setConfirmPassword('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}