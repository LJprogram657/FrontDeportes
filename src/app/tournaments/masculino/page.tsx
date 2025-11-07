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
    const loadData = async () => {
      try {
        const res = await fetch('/api/tournaments/active?category=masculino', { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudieron cargar torneos masculinos');
        const list = await res.json();

        const masculineTournaments: Tournament[] = (Array.isArray(list) ? list : []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          logo: t.logo || '/images/logo.png',
          category: 'masculino' as const,
          modality: 'futsal' as const,
          status: String(t.status),
          startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : undefined,
          endDate: undefined,
          description: undefined,
        }));
        setTournaments(masculineTournaments);

        // Cargar próximos partidos por torneo (público)
        const allMatches: Match[] = [];
        for (const t of masculineTournaments) {
          const mRes = await fetch(`/api/tournaments/${t.id}/matches`, { cache: 'no-store' });
          if (!mRes.ok) continue;
          const mList = await mRes.json();
          const mapped: Match[] = (Array.isArray(mList) ? mList : [])
            .filter((m: any) => m.status === 'scheduled')
            .map((m: any) => ({
              id: String(m.id),
              phase: m.phase || 'Sin Fase',
              homeTeam: m.homeTeam ? { name: m.homeTeam.name, logo: m.homeTeam.logo } : null,
              awayTeam: m.awayTeam ? { name: m.awayTeam.name, logo: m.awayTeam.logo } : null,
              date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
              time: m.time ?? undefined,
              venue: m.venue ?? undefined,
              status: 'scheduled',
            }));
          allMatches.push(...mapped);
        }
        setMatches(allMatches);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setTournaments([]);
        setMatches([]);
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
                      <img src={match.homeTeam?.logo || '/images/logo.png'} alt={match.homeTeam?.name} />
                      <span>{match.homeTeam?.name || 'TBD'}</span>
                    </div>
                    <div className="vs">VS</div>
                    <div className="team">
                      <img src={match.awayTeam?.logo || '/images/logo.png'} alt={match.awayTeam?.name} />
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