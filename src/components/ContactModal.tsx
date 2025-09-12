'use client';

import React from 'react';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Información de Contacto</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="contact-item">
            <EnvelopeIcon className="contact-icon" />
            <div>
              <strong>Correo Electrónico:</strong>
              <a href="mailto:luiscarlosmer@hotmail.com">luiscarlosmer@hotmail.com</a>
            </div>
          </div>
          <div className="contact-item">
            <PhoneIcon className="contact-icon" />
            <div>
              <strong>Teléfono / WhatsApp:</strong>
              <a href="https://wa.me/573133048115" target="_blank" rel="noopener noreferrer">313 304 8115</a>
            </div>
          </div>
          <p className="contact-note">
            ¡No dudes en escribirnos o llamarnos para más información!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;