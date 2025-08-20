'use client';

import React from 'react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Información de Contacto</h2>
        <div className="contact-info">
          <p>
            <strong>Correo Electrónico:</strong>
            <a href="mailto:luiscarlosmer@hotmail.com">luiscarlosmer@hotmail.com</a>
          </p>
          <p>
            <strong>Teléfono / WhatsApp:</strong>
            <a href="https://wa.me/573133048115" target="_blank" rel="noopener noreferrer">313 304 8115</a>
          </p>
          <p className="contact-note">¡No dudes en escribirnos o llamarnos para más información!</p>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;