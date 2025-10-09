import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { DeploymentsTab } from './DeploymentsTab';
import { BillingTab } from './BillingTab';
import { AdminTab } from './AdminTab';
import { AccessControlTab } from './AccessControlTab';
import { ProfileTab } from './ProfileTab';

export function Dashboard() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('deployments');

  useEffect(() => {
    // Check for tab in URL query parameter
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam && ['deployments', 'billing', 'admin', 'access', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    } 
    // If no tab is specified in URL and user is admin, default to 'admin'
    else if (!tabParam && !isLoading && user?.role === 'admin') {
      setActiveTab('admin');
    }
  }, [location, user, isLoading]);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'deployments' && <DeploymentsTab />}
      {activeTab === 'billing' && <BillingTab />}
      {activeTab === 'admin' && user?.role === 'admin' && <AdminTab />}
      {activeTab === 'access' && user?.role === 'admin' && <AccessControlTab />}
      {activeTab === 'profile' && <ProfileTab />}
    </Layout>
  );
}