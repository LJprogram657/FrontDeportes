'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    <section className="hero">
      <div className="hero-slider" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {slides.map((slide, index) => (
          <div key={index} className="hero-slide" style={{ backgroundImage: `url(${slide.image})` }}>
            <div className="hero-content">
              <div className="hero-logo-container">
                <Link href="/">
                  <Image src="/images/logo.png" alt="Deportes Logo" className="hero-logo" width={120} height={60} />
                </Link>
              </div>
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>
              <div className="hero-buttons">
                <Link href="/tournaments/masculino" className="btn">Torneos Masculinos</Link>
                <Link href="/tournaments/femenino" className="btn">Torneos Femeninos</Link>
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