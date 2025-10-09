import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/api';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const { user } = await apiService.getProfile();
          setUser(user);
          
          // Connect WebSocket after successful authentication
          webSocketService.connect(token);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          apiService.clearToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Set up WebSocket listeners for user status changes
    const handleUserOnline = (data: { userId: string; status: string; lastActivity?: string }) => {
      if (user && user.id === data.userId) {
        // Update current user status
        setUser(prevUser => 
          prevUser 
            ? { ...prevUser, status: data.status as 'online' | 'away' | 'offline', lastActivity: data.lastActivity || prevUser.lastActivity } 
            : null
        );
      }
    };

    const handleUserOffline = (data: { userId: string; status: string; lastActivity?: string }) => {
      if (user && user.id === data.userId) {
        // Update current user status
        setUser(prevUser => 
          prevUser 
            ? { ...prevUser, status: data.status as 'online' | 'away' | 'offline', lastActivity: data.lastActivity || prevUser.lastActivity } 
            : null
        );
      }
    };

    webSocketService.onUserOnline(handleUserOnline);
    webSocketService.onUserOffline(handleUserOffline);

    // Cleanup function
    return () => {
      webSocketService.offUserOnline(handleUserOnline);
      webSocketService.offUserOffline(handleUserOffline);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    apiService.setToken(response.token);
    setUser(response.user);
    
    // Connect WebSocket after successful login
    const token = localStorage.getItem('authToken');
    if (token) {
      webSocketService.connect(token);
    }
  };

  const register = async (email: string, password: string, name: string, confirmPassword: string) => {
    const response = await apiService.register(email, password, name, confirmPassword);
    apiService.setToken(response.token);
    setUser(response.user);
    
    // Connect WebSocket after successful registration
    const token = localStorage.getItem('authToken');
    if (token) {
      webSocketService.connect(token);
    }
  };

  const logout = () => {
    apiService.clearToken();
    setUser(null);
    
    // Disconnect WebSocket on logout
    webSocketService.disconnect();
  };

  const refreshProfile = async () => {
    try {
      const { user } = await apiService.getProfile();
      setUser(user);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
