import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Perform logout
    logout();
    // Redirect to login page after logout
    navigate('/auth', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-gray-700 dark:text-gray-300">Logging out...</p>
      </div>
    </div>
  );
};

export default Logout;