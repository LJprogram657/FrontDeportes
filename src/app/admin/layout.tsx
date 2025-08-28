'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SidebarNav from '../../components/SidebarNav';
import '../styles/admin-dashboard.css';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated || !user?.is_admin) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <SidebarNav />
      <div className="dashboard-content">
        <header className="header-bar">
          <div className="header-left">
            <h1>Panel de Administrador</h1>
            <p className="header-subtitle">Sistema de Gestión Deportiva</p>
          </div>
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">Bienvenido, {user.first_name} {user.last_name}</span>
              <span className="user-role">Administrador</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <span>🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;