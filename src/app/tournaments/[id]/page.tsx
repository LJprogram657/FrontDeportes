import React from 'react';
import Link from 'next/link';
import tournaments from '@/data/tournaments.json';
import { notFound } from 'next/navigation';
import TournamentDetails from '@/components/TournamentDetails';
import BackButton from '@/components/BackButton';
import SidebarNav from '@/components/SidebarNav';

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

const TournamentPage = ({ params }: { params: { id: string } }) => {
  return (
    <div className="container">
      <div className="back-button-container">
        <BackButton />
      </div>
      <TournamentDetails tournamentId={params.id} />
    </div>
  );
};

export default TournamentPage;

function getTournamentById(id: string) {
  return tournaments.find((t) => t.id === parseInt(id, 10));
}