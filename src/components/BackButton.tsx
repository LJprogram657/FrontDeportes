'use client';
import { useRouter } from 'next/navigation';

const BackButton = () => {
  const router = useRouter();

  return (
    <button onClick={() => router.back()} className="back-button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span>Volver</span>
    </button>
  );
};

export default BackButton;