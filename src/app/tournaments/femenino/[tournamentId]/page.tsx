import React from 'react';
import TournamentDetails from '@/components/TournamentDetails';
import BackButton from '@/components/BackButton';

// Interfaz actualizada para Next.js 15 con params asíncrono
interface PaginaDetalleTorneoFemeninoProps {
  params: Promise<{ tournamentId: string }>;
}

export default async function PaginaDetalleTorneoFemenino({ params }: PaginaDetalleTorneoFemeninoProps) {
  // Await the params since they're now async in Next.js 15
  const { tournamentId } = await params;
  const tournamentName = tournamentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <BackButton />
      <div className="tournaments-page">
        <div className="container">
          <TournamentDetails tournamentName={tournamentName} />
        </div>
      </div>
    </>
  );
}