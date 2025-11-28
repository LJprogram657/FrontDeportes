'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  // Re-monta en cada ruta para aplicar animación de entrada
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
};

export default PageTransition;

