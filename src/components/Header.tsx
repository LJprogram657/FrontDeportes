'use client';

import React from 'react';
import Link from 'next/link';
import LoginModal from './LoginModal';
import ContactModal from './ContactModal';

const Header: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

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
            </ul>
          </nav>
          <div className="header-actions">
            <button className="btn btn-register">Crear Equipo</button>
            <button className="btn btn-login" onClick={openLoginModal}>
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <ContactModal isOpen={isContactModalOpen} onClose={closeContactModal} />
    </>
  );
};

export default Header;