'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../app/styles/sidebar-nav.css';

const SidebarNav: React.FC = () => {
  const pathname = usePathname();

  const modules = [
    {
      name: 'Creación de torneos',
      path: '/admin/tournaments/create',
      icon: '🏆'
    },
    {
      name: 'Actualización de información',
      path: '/admin/tournaments/update',
      icon: '📝'
    },
    {
      name: 'Gestión de registro',
      path: '/admin/registrations',
      icon: '👥'
    },
    {
      name: 'Programación de partidos',
      path: '/admin/scheduling',
      icon: '⚽'
    }
  ];

  return (
    <div className="sidebar-nav">
      <div className="sidebar-header">
        <Link href="/" className="admin-logo-link">
          <div className="admin-logo">
            <img src="/images/logo.png" alt="Logo" className="logo-img" />
            <h3>Admin Panel</h3>
          </div>
        </Link>
      </div>
      <nav className="nav-links">
        {modules.map((module) => (
          <Link key={module.path} href={module.path} className={`nav-link ${pathname === module.path ? 'active' : ''}`}>
            <span className="nav-icon">{module.icon}</span>
            <span className="nav-text">{module.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default SidebarNav;