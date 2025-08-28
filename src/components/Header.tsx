'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import ContactModal from './ContactModal';

const Header: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <header className="header">
        <div className="container">
          <nav>
            <ul>
              <li><Link href="/" className="nav-link">Inicio</Link></li>
              <li><Link href="/tournaments/masculino" className="nav-link">Torneos Masculinos</Link></li>
              <li><Link href="/tournaments/femenino" className="nav-link">Torneos Femeninos</Link></li>
              <li><button className="nav-button nav-link" onClick={openContactModal}>Contáctenos</button></li>
              {isAuthenticated && user?.is_admin && (
                <li><Link href="/admin/dashboard" className="nav-link">Panel Admin</Link></li>
              )}
            </ul>
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <span style={{ marginRight: '10px', color: '#333' }}>
                  Hola, {user?.first_name || user?.email}
                </span>
                <Link href="/create-team" className="btn btn-register">
                  Crear Equipo
                </Link>
                <button className="btn btn-login" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/create-team" className="btn btn-register">
                  Crear Equipo
                </Link>
                <button className="btn btn-login" onClick={openLoginModal}>
                  Iniciar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <ContactModal isOpen={isContactModalOpen} onClose={closeContactModal} />
    </>
  );
};

export default Header;