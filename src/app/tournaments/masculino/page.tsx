'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

interface Tournament {
  id: number;
  name: string;
  logo: string;
  category: 'masculino' | 'femenino';
  modality: 'futsal' | 'futbol7';
  status: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface Match {
  id: string;
  phase: string;
  homeTeam: any;
  awayTeam: any;
  date?: string;
  time?: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'finished';
}

const MasculinoPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        // Cargar torneos masculinos del localStorage
        const adminTournaments = JSON.parse(localStorage.getItem('admin_created_tournaments') || '[]');
        const masculineTournaments = adminTournaments.filter((t: Tournament) => t.category === 'masculino');
        setTournaments(masculineTournaments);

        // Cargar partidos programados (si existen)
        const scheduledMatches = JSON.parse(localStorage.getItem('scheduled_matches') || '[]');
        const masculineMatches = scheduledMatches.filter((match: any) => {
          const tournament = masculineTournaments.find((t: Tournament) => t.id === match.tournamentId);
          return tournament !== undefined;
        });
        setMatches(masculineMatches);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando torneos masculinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="back-button-container">
        <BackButton />
      </div>
      <h1 className="main-title">Torneos Masculinos</h1>
      
      {tournaments.length === 0 ? (
        <div className="no-tournaments">
          <p>No hay torneos masculinos disponibles en este momento.</p>
          <p>Los torneos aparecerán aquí una vez que el administrador los cree.</p>
        </div>
      ) : (
        <div className="tournaments-grid">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="tournament-card">
              <div className="tournament-header">
                <img 
                  src={tournament.logo || '/images/default-tournament.png'} 
                  alt={tournament.name}
                  className="tournament-logo"
                />
                <h3>{tournament.name}</h3>
              </div>
              
              <div className="tournament-info">
                <p><strong>Modalidad:</strong> {tournament.modality === 'futsal' ? 'Fútbol de Salón' : 'Fútbol 7'}</p>
                {tournament.startDate && tournament.endDate && (
                  <p><strong>Fechas:</strong> {tournament.startDate} - {tournament.endDate}</p>
                )}
                <p><strong>Estado:</strong> {tournament.status || 'Activo'}</p>
              </div>

              <div className="tournament-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {matches.filter(m => m.status === 'finished').length}
                  </span>
                  <span className="stat-label">Partidos Jugados</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {matches.filter(m => m.status === 'scheduled').length}
                  </span>
                  <span className="stat-label">Próximos Partidos</span>
                </div>
              </div>

              <Link href={`/tournaments/${tournament.id}`} className="btn btn-primary">
                Ver Detalles del Torneo
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Próximos partidos */}
      {matches.filter(m => m.status === 'scheduled').length > 0 && (
        <div className="upcoming-matches-section">
          <h2>Próximos Partidos</h2>
          <div className="matches-grid">
            {matches
              .filter(m => m.status === 'scheduled')
              .slice(0, 6)
              .map((match) => (
                <div key={match.id} className="match-card">
                  <div className="match-teams">
                    <div className="team">
                      <img src={match.homeTeam?.logo || '/images/default-team.png'} alt={match.homeTeam?.name} />
                      <span>{match.homeTeam?.name || 'TBD'}</span>
                    </div>
                    <div className="vs">VS</div>
                    <div className="team">
                      <img src={match.awayTeam?.logo || '/images/default-team.png'} alt={match.awayTeam?.name} />
                      <span>{match.awayTeam?.name || 'TBD'}</span>
                    </div>
                  </div>
                  <div className="match-info">
                    {match.date && <p><strong>Fecha:</strong> {match.date}</p>}
                    {match.time && <p><strong>Hora:</strong> {match.time}</p>}
                    {match.venue && <p><strong>Cancha:</strong> {match.venue}</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasculinoPage;