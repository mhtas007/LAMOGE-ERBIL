/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Menu } from './pages/Menu';
import { Tables } from './pages/Tables';
import { Expenses } from './pages/Expenses';
import { Receipts } from './pages/Receipts';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Shifts } from './pages/Shifts';
import { Inventory } from './pages/Inventory';

const AppContent: React.FC = () => {
  const { user, currentPath, navigate, loadingAuth } = useAppContext();

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-natural-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    let path = currentPath;
    
    // Check if user has permission to view this path
    const hasPermission = (p: string) => {
      if (p === 'dashboard') return true; // Everyone can see the Launchpad Home
      if (user?.role === 'super_admin' || user?.role === 'admin') return true;
      return user?.permissions?.includes(p) || false;
    };

    if (!hasPermission(path)) {
      path = 'dashboard';
      setTimeout(() => navigate('dashboard'), 0);
    }

    switch (path) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'menu': return <Menu />;
      case 'tables': return <Tables />;
      case 'expenses': return <Expenses />;
      case 'inventory': return <Inventory />;
      case 'receipts': return <Receipts />;
      case 'reports': return <Reports />;
      case 'users': return <Users />;
      case 'shifts': return <Shifts />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

