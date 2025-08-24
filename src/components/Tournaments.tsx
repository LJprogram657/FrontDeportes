'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import tournamentsData from '@/data/tournaments.json';

interface Tournament {
  id: number;
  title: string;
  description: string;
  image: string;
  category: 'Masculino' | 'Femenino';
}

const Tournaments: React.FC = () => {
  const torneosMasculinos = tournamentsData.filter(
    (t) => t.category === 'Masculino'
  );
  const torneosFemeninos = tournamentsData.filter(
    (t) => t.category === 'Femenino'
  );

  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <div key={tournament.id} className="tournament-card">
      <Image
        src={tournament.image}
        alt={tournament.title}
        width={300}
        height={200}
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
        <h1 className="main-title">Todos los Torneos Disponibles</h1>

        <div className="tournament-category-section">
          <h2 className="category-title">Torneos Masculinos</h2>
          <div className="tournaments-grid">
            {torneosMasculinos.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>

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