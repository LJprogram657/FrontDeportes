import React from 'react';
import tournaments from '@/data/tournaments.json';
import { notFound } from 'next/navigation';
import TournamentDetails from '@/components/TournamentDetails';
import BackButton from '@/components/BackButton';
import Image from 'next/image';

// Interfaz actualizada para Next.js 15 con params asíncrono
interface TournamentPageProps {
  params: Promise<{ id: string }>;
}

const TournamentPage = async ({ params }: TournamentPageProps) => {
  // Await the params since they're now async in Next.js 15
  const { id } = await params;
  
  const tournament = tournaments.find(t => t.id === parseInt(id, 10));

  if (!tournament) {
    notFound();
  }

  return (
    <div className="container">
      <div className="back-button-container">
        <BackButton />
      </div>
      <main className="main-container">
        <div className="tournament-details">
          <Image 
            src={tournament.image} 
            alt={tournament.title} 
            width={800} 
            height={400} 
            className="tournament-image-large" 
          />
          <h1>{tournament.title}</h1>
          <p>{tournament.description}</p>
          <p><strong>ID del Torneo:</strong> {tournament.id}</p>
        </div>
      </main>
      <TournamentDetails tournamentName={tournament.title} />
    </div>
  );
};

export default TournamentPage;