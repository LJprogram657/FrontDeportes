import React from 'react';
import TournamentDetails from '@/components/TournamentDetails';
import BackButton from '@/components/BackButton'; // <-- Importa el botón

export default function PaginaDetalleTorneo({ params }: { params: { tournamentId: string } }) {
  const tournamentName = params.tournamentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <BackButton /> {/* <-- Añade el botón aquí */}
      <div className="tournaments-page">
        <div className="container">
          <TournamentDetails tournamentName={tournamentName} />
        </div>
      </div>
    </>
  );
}