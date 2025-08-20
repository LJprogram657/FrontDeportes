'use client';

import React from 'react';
import Link from 'next/link';
import tournamentsData from '@/data/tournaments.json';

interface Tournament {
  id: number;
  title: string;
  description: string;
  image: string;
  category: 'Masculino' | 'Femenino';
}

const Tournaments: React.FC = () => {
  // Filtramos los torneos por categoría
  const torneosMasculinos = tournamentsData.filter(
    (t) => t.category === 'Masculino'
  );
  const torneosFemeninos = tournamentsData.filter(
    (t) => t.category === 'Femenino'
  );

  // Creamos un componente reutilizable para renderizar las tarjetas
  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <div key={tournament.id} className="tournament-card">
      {/* Ya no necesitamos contenedores extra para la imagen o el contenido */}
      <img
        src={tournament.image}
        alt={tournament.title}
        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }}
      />
      <h3>{tournament.title}</h3>
      <p>{tournament.description}</p>
      <Link href={`/tournaments/${tournament.id}`} className="btn">
        Ver Más
      </Link>
    </div>
  );

  return (
    <section className="tournaments-section">
      <div className="container">
        {/* Título principal añadido */}
        <h1 className="main-title">Todos los Torneos Disponibles</h1>

        {/* Sección para Torneos Masculinos */}
        <div className="tournament-category-section">
          <h2 className="category-title">Torneos Masculinos</h2>
          <div className="tournaments-grid">
            {torneosMasculinos.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>

        {/* Sección para Torneos Femeninos */}
        <div className="tournament-category-section">
          <h2 className="category-title">Torneos Femeninos</h2>
          <div className="tournaments-grid">
            {torneosFemeninos.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tournaments;