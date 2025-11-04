import React from 'react';
import { notFound } from 'next/navigation';
import TournamentDetails from '@/components/TournamentDetails';
import BackButton from '@/components/BackButton';
import Image from 'next/image';

interface TournamentPageProps {
  params: { id: string };
}

const TournamentPage = async ({ params }: TournamentPageProps) => {
  const { id } = params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/tournaments/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    notFound();
  }
  const t = await res.json();

  const tournament = {
    id: t.id,
    title: t.name,
    description: t.description ?? 'Torneo',
    image: t.logo || '/images/slider1.jpg',
  };

  return (
    <div className="container">
      <div className="back-button-container">
        <BackButton />
      </div>
      <main className="main-container">
        <div className="tournament-details">
          <Image 
            src={tournament.image || '/images/slider1.jpg'}
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