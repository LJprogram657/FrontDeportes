import React from 'react';
import tournaments from '@/data/tournaments.json';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

const FemeninoPage = () => {
  const torneosFemeninos = tournaments.filter(
    (t) => t.category === 'Femenino'
  );

  return (
    <div className="container">
      <div className="back-button-container">
        <BackButton />
      </div>
      <h1 className="main-title">Torneos Femeninos</h1>
      <div className="tournaments-grid">
        {torneosFemeninos.map((tournament) => (
          <div key={tournament.id} className="tournament-card">
            <h3>{tournament.title}</h3>
            <Link href={`/tournaments/${tournament.id}`} className="btn">
              Ver detalles del torneo
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FemeninoPage;