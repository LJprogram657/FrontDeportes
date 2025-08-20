'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const slides = [
  {
    image: '/images/slide1.jpg',
    title: 'Organiza y Compite en los Mejores Torneos',
    subtitle: 'La plataforma definitiva para los amantes del fútbol.',
  },
  {
    image: '/images/slide2.jpg',
    title: 'Vive la Pasión del Deporte Rey',
    subtitle: 'Inscribe a tu equipo y demuestra que son los mejores.',
  },
];

const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000); // Cambia de slide cada 5 segundos
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <section className="hero">
      <div className="hero-slider" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {slides.map((slide, index) => (
          <div key={index} className="hero-slide" style={{ backgroundImage: `url(${slide.image})` }}>
            <div className="hero-content">
              {/* Logo devuelto a su posición original en el Hero */}
              <div className="hero-logo-container">
                <Link href="/">
                  <img src="/images/logo.png" alt="Deportes Logo" className="hero-logo" />
                </Link>
              </div>
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>
              <div className="hero-buttons">
                <a href="/tournaments/masculino" className="btn">Torneos Masculinos</a>
                <a href="/tournaments/femenino" className="btn">Torneos Femeninos</a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="slider-nav">
        {slides.map((_, index) => (
          <button
            key={index}
            className={currentIndex === index ? 'active' : ''}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir a la diapositiva ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;