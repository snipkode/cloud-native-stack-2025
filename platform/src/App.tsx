import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthForm } from './components/AuthForm';
import { Loader } from 'lucide-react';
import LandingPage from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import Logout from './components/Logout';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // If authenticated, show dashboard
  return <Dashboard />;
}

function App() {
  return (
    <NotificationProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <LanguageProvider>
            <Router>
              <AuthProvider>
                <WebSocketProvider>
                  <Routes>
                    <Route path="/" element={<AppContent />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard/*" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/auth" element={<AuthForm />} />
                    <Route path="/auth/*" element={<AuthForm />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </WebSocketProvider>
              </AuthProvider>
            </Router>
          </LanguageProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </NotificationProvider>
  );
}

export default App;
