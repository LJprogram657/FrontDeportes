import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="bg-[#151515] border-t border-white/10 text-gray-300 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          {/* About Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <div className="relative w-24 h-24 bg-white/5 rounded-2xl p-2">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={100}
                height={100}
                className="w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Tu plataforma para gestionar y participar en los mejores torneos
              deportivos. Vive la pasión del deporte con nosotros.
            </p>
          </div>

          {/* Links Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:block after:w-12 after:h-1 after:bg-[#e31c25] after:mt-2 after:rounded-full mx-auto md:mx-0">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="hover:text-[#e31c25] hover:translate-x-1 transition-all inline-block">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/tournaments/masculino" className="hover:text-[#e31c25] hover:translate-x-1 transition-all inline-block">
                  Torneos
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-[#e31c25] hover:translate-x-1 transition-all inline-block">
                  Reglamento
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#e31c25] hover:translate-x-1 transition-all inline-block">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:block after:w-12 after:h-1 after:bg-[#e31c25] after:mt-2 after:rounded-full mx-auto md:mx-0">
              Síguenos
            </h4>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1877f2] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1da1f2] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <FaTwitter />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#fd5949] hover:to-[#d6249f] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Eventos Deportivos LCG. Todos los
          derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;