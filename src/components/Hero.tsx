'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import '../styles/hero.css'; // Eliminamos importación de CSS

const slides = [
  { image: '/images/slider1.jpg', title: 'Organiza y Compite en los Mejores Torneos', subtitle: 'La plataforma definitiva para los amantes del fútbol.' },
  { image: '/images/slider2.jpg', title: 'Organiza y Compite en los Mejores Torneos', subtitle: 'La plataforma definitiva para los amantes del fútbol.' },
  { image: '/images/slider4.jpg', title: 'Organiza y Compite en los Mejores Torneos', subtitle: 'La plataforma definitiva para los amantes del fútbol.' },
  { image: '/images/slider5.jpg', title: 'Organiza y Compite en los Mejores Torneos', subtitle: 'La plataforma definitiva para los amantes del fútbol.' },
];

const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-black text-white">
      {/* Slider Container */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-in-out" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-full h-full bg-cover bg-center relative" 
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 z-10" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-4 md:px-0">
              <div className="mb-6 animate-fade-in">
                <Link href="/">
                  <Image 
                    src="/images/logo.png" 
                    alt="Deportes Logo" 
                    width={120} 
                    height={60} 
                    className="h-16 w-auto md:h-20 md:w-auto drop-shadow-lg"
                  />
                </Link>
              </div>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-4xl leading-tight drop-shadow-md">
                {slide.title}
              </h1>
              
              <p className="text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl drop-shadow-sm">
                {slide.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link 
                  href="/tournaments/masculino" 
                  className="px-8 py-3 bg-[#e31c25] hover:bg-[#c41820] text-white font-semibold rounded-full transition-colors text-center shadow-lg"
                >
                  Torneos Masculinos
                </Link>
                <Link 
                  href="/tournaments/femenino" 
                  className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-semibold rounded-full transition-colors text-center shadow-lg"
                >
                  Torneos Femeninos
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir a la diapositiva ${index + 1}`}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentIndex === index ? 'bg-[#e31c25] w-8' : 'bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;