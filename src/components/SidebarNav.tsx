import Image from 'next/image';
import BackButton from './BackButton';

const SidebarNav = () => {
  return (
    <aside className="sidebar-nav">
      <div className="sidebar-logo-container">
        <Image 
          src="/images/logo.png" 
          alt="Logo Animado" 
          className="sidebar-logo" 
          width={150} 
          height={150} 
        />
        <BackButton />
      </div>
    </aside>
  );
};

export default SidebarNav;