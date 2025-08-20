import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-section about">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="footer-logo"
          />
          <p>
            Tu plataforma para gestionar y participar en los mejores torneos
            deportivos. Vive la pasión del deporte con nosotros.
          </p>
        </div>
        <div className="footer-section links">
          <h4>Enlaces Rápidos</h4>
          <ul>
            <li>
              <Link href="/">Inicio</Link>
            </li>
            <li>
              <Link href="/tournaments">Torneos</Link>
            </li>
            <li>
              <Link href="/rules">Reglamento</Link>
            </li>
            <li>
              <Link href="/privacy">Política de Privacidad</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section social">
          <h4>Síguenos</h4>
          <div className="social-icons">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitter />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Eventos Deportivos LCG. Todos los
        derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;