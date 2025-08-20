'use client';

import React, { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={handleModalContentClick}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2>Iniciar Sesión</h2>
        
        <form className="login-form">
          <label htmlFor="username">Usuario</label>
          <input id="username" type="text" required />
          
          <label htmlFor="password">Contraseña</label>
          <div className="password-wrapper">
            <input id="password" type={showPassword ? 'text' : 'password'} required />
            <button type="button" onClick={togglePasswordVisibility} className="toggle-password">
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          <button type="submit" className="btn login-form-btn">Acceder</button>
        </form>

      </div>
    </div>
  );
};

export default LoginModal;