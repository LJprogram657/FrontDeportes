import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <div className="site-logo-container">
      <Link href="/">
        <Image src="/images/logo.png" alt="Eventos LCG Logo" width={120} height={120} className="site-logo" />
      </Link>
    </div>
  );
};

export default Logo;