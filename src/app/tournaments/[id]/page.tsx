import React from 'react';
import Link from 'next/link';
import tournaments from '@/data/tournaments.json';
import { notFound } from 'next/navigation';
import TournamentDetails from '@/components/TournamentDetails';
import BackButton from '@/components/BackButton';
import SidebarNav from '@/components/SidebarNav';
import Image from 'next/image';

// Esta es la interfaz que define cómo son los props que recibirá nuestra página.
// Next.js nos pasará un objeto `params` con el `id` de la URL.
interface TournamentDetailsPageProps {
  params: {
    id: string;
  };
}

const TournamentDetailsPage: React.FC<TournamentDetailsPageProps> = ({ params }) => {
  // Buscamos en nuestros datos el torneo que coincida con el id de la URL.
  // El `params.id` viene como string, así que lo convertimos a número.
  const tournament = tournaments.find(t => t.id === parseInt(params.id, 10));

  // Si no encontramos un torneo con ese id, mostramos una página de "No encontrado".
  if (!tournament) {
    notFound();
  }

  return (
    <main className="main-container">
      <div className="container">
        <div className="tournament-details">
          <img src={tournament.image} alt={tournament.title} className="tournament-image-large" />
          <h1>{tournament.title}</h1>
          <p>{tournament.description}</p>
          <p><strong>ID del Torneo:</strong> {tournament.id}</p>
          {/* Aquí podrías añadir más detalles, como lista de equipos, calendario, etc. */}
        </div>
      </div>
    </main>
  );
};

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

function getTournamentById(id: string) {
  return tournaments.find((t) => t.id === parseInt(id, 10));
}