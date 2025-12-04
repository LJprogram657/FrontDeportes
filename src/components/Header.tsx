'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import ContactModal from './ContactModal';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-[#e31c25] to-[#ff4d4d] rounded-lg p-0.5 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-black rounded-[7px] flex items-center justify-center">
                <span className="text-[#e31c25] font-bold text-lg md:text-xl">R</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-all">
              Inicio
            </Link>
            <Link href="/tournaments/masculino" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-all">
              Masculino
            </Link>
            <Link href="/tournaments/femenino" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-all">
              Femenino
            </Link>
            <button onClick={openContactModal} className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md transition-all">
              Contacto
            </button>
            {isAuthenticated && user?.is_admin && (
              <Link href="/admin/dashboard" className="text-sm font-medium text-[#e31c25] hover:text-[#ff4d4d] px-3 py-2 rounded-md transition-all bg-[#e31c25]/10 hover:bg-[#e31c25]/20">
                Panel Admin
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  Hola, <span className="text-white font-medium">{user?.first_name || user?.email}</span>
                </span>
                <Link 
                  href="/create-team" 
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e31c25] hover:bg-[#c41820] rounded-lg transition-colors shadow-lg shadow-red-900/20"
                >
                  Crear Equipo
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-300 border border-white/20 hover:bg-white/5 hover:text-white rounded-lg transition-all"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/create-team" 
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e31c25] hover:bg-[#c41820] rounded-lg transition-colors shadow-lg shadow-red-900/20"
                >
                  Crear Equipo
                </Link>
                <button 
                  onClick={openLoginModal}
                  className="px-4 py-2 text-sm font-medium text-gray-300 border border-white/20 hover:bg-white/5 hover:text-white rounded-lg transition-all"
                >
                  Entrar
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#1a1a1a] absolute w-full left-0 shadow-xl animate-in slide-in-from-top-2">
            <div className="p-4 space-y-3">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Inicio
              </Link>
              <Link 
                href="/tournaments/masculino" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Torneos Masculinos
              </Link>
              <Link 
                href="/tournaments/femenino" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Torneos Femeninos
              </Link>
              <button 
                onClick={() => { openContactModal(); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Contacto
              </button>
              {isAuthenticated && user?.is_admin && (
                <Link 
                  href="/admin/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-[#e31c25] bg-[#e31c25]/10 rounded-lg transition-colors"
                >
                  Panel Admin
                </Link>
              )}

              <div className="h-px bg-white/10 my-2" />

              {isAuthenticated ? (
                <div className="space-y-3 pt-2">
                  <div className="px-4 text-sm text-gray-400">
                    Sesión de <span className="text-white font-medium">{user?.first_name || user?.email}</span>
                  </div>
                  <Link 
                    href="/create-team" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 text-base font-medium text-white bg-[#e31c25] active:bg-[#c41820] rounded-lg transition-colors"
                  >
                    Crear Equipo
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full px-4 py-3 text-base font-medium text-gray-300 border border-white/20 active:bg-white/5 rounded-lg transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link 
                    href="/create-team" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-[#e31c25] active:bg-[#c41820] rounded-lg transition-colors"
                  >
                    Crear Equipo
                  </Link>
                  <button 
                    onClick={() => { openLoginModal(); setIsMobileMenuOpen(false); }}
                    className="px-4 py-3 text-base font-medium text-gray-300 border border-white/20 active:bg-white/5 rounded-lg transition-colors"
                  >
                    Entrar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <ContactModal isOpen={isContactModalOpen} onClose={closeContactModal} />
    </>
  );
}

export default Header;