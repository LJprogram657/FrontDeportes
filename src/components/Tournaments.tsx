'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

// Modelos usados para cargar y calcular
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

interface Standing {
  id: number;
  team: { name: string; logo?: string | null };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

// Cálculo de tabla de posiciones (misma lógica que en las páginas por categoría)
function computeStandings(matches: Match[]): Standing[] {
  const teams = new Map<string, { name: string; logo?: string | null }>();
  const stats = new Map<string, {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    logo?: string | null;
  }>();

  for (const m of matches) {
    const homeName = m.homeTeam?.name;
    const awayName = m.awayTeam?.name;
    const homeLogo = m.homeTeam?.logo ?? null;
    const awayLogo = m.awayTeam?.logo ?? null;

    if (homeName) {
      teams.set(homeName, { name: homeName, logo: homeLogo });
      if (!stats.has(homeName)) {
        stats.set(homeName, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, logo: homeLogo });
      }
    }
    if (awayName) {
      teams.set(awayName, { name: awayName, logo: awayLogo });
      if (!stats.has(awayName)) {
        stats.set(awayName, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, logo: awayLogo });
      }
    }

    if (m.status === 'finished' && typeof m.homeScore === 'number' && typeof m.awayScore === 'number') {
      if (homeName) {
        const s = stats.get(homeName)!;
        s.played += 1;
        s.goalsFor += m.homeScore;
        s.goalsAgainst += m.awayScore;
        if (m.homeScore > m.awayScore) { s.wins += 1; s.points += 3; }
        else if (m.homeScore === m.awayScore) { s.draws += 1; s.points += 1; }
        else { s.losses += 1; }
      }
      if (awayName) {
        const s = stats.get(awayName)!;
        s.played += 1;
        s.goalsFor += m.awayScore;
        s.goalsAgainst += m.homeScore;
        if (m.awayScore > m.homeScore) { s.wins += 1; s.points += 3; }
        else if (m.awayScore === m.homeScore) { s.draws += 1; s.points += 1; }
        else { s.losses += 1; }
      }
    }
  }

  const table = Array.from(teams.values()).map((t, idx) => {
    const s = stats.get(t.name)!;
    const goalDiff = s.goalsFor - s.goalsAgainst;
    return {
      id: idx + 1,
      team: { name: t.name, logo: s.logo },
      played: s.played,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDiff,
      points: s.points,
    } as Standing;
  });

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  return table;
}

const Tournaments: React.FC = () => {
  // Estado por categoría
  const [masculineTournaments, setMasculineTournaments] = useState<Tournament[]>([]);
  const [feminineTournaments, setFeminineTournaments] = useState<Tournament[]>([]);
  const [masculineMatches, setMasculineMatches] = useState<Match[]>([]);
  const [feminineMatches, setFeminineMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tablas de posiciones por categoría
  const masculineStandings = useMemo<Standing[]>(
    () => computeStandings(masculineMatches),
    [masculineMatches]
  );
  const feminineStandings = useMemo<Standing[]>(
    () => computeStandings(feminineMatches),
    [feminineMatches]
  );

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Torneos masculinos activos
        const mRes = await fetch('/api/tournaments/active?category=masculino', { cache: 'no-store' });
        const mList = mRes.ok ? await mRes.json() : [];
        const mT: Tournament[] = (Array.isArray(mList) ? mList : []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          logo: t.logo || '/images/logo.png',
          category: 'masculino',
          modality: t.modality === 'futbol7' ? 'futbol7' : 'futsal',
          status: String(t.status || 'active'),
          startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : undefined,
          endDate: t.end_date ? new Date(t.end_date).toISOString().slice(0, 10) : undefined,
          description: t.description ?? undefined,
        }));
        setMasculineTournaments(mT);

        // Partidos de todos los torneos masculinos
        const mMatches: Match[] = [];
        for (const t of mT) {
          const mmRes = await fetch(`/api/tournaments/${t.id}/matches`, { cache: 'no-store' });
          if (!mmRes.ok) continue;
          const mmList = await mmRes.json();
          const mapped: Match[] = (Array.isArray(mmList) ? mmList : []).map((m: any) => ({
            id: String(m.id),
            phase: m.phase || 'Sin Fase',
            homeTeam: m.homeTeam ? { name: m.homeTeam.name, logo: m.homeTeam.logo } : null,
            awayTeam: m.awayTeam ? { name: m.awayTeam.name, logo: m.awayTeam.logo } : null,
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
            time: m.time ?? undefined,
            venue: m.venue ?? undefined,
            homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
            awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
            status: m.status === 'finished' ? 'finished' : 'scheduled',
          }));
          mMatches.push(...mapped);
        }
        setMasculineMatches(mMatches);

        // Torneos femeninos activos
        const fRes = await fetch('/api/tournaments/active?category=femenino', { cache: 'no-store' });
        const fList = fRes.ok ? await fRes.json() : [];
        const fT: Tournament[] = (Array.isArray(fList) ? fList : []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          logo: t.logo || '/images/logo.png',
          category: 'femenino',
          modality: t.modality === 'futbol7' ? 'futbol7' : 'futsal',
          status: String(t.status || 'active'),
          startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : undefined,
          endDate: t.end_date ? new Date(t.end_date).toISOString().slice(0, 10) : undefined,
          description: t.description ?? undefined,
        }));
        setFeminineTournaments(fT);

        // Partidos de todos los torneos femeninos
        const fMatches: Match[] = [];
        for (const t of fT) {
          const fmRes = await fetch(`/api/tournaments/${t.id}/matches`, { cache: 'no-store' });
          if (!fmRes.ok) continue;
          const fmList = await fmRes.json();
          const mapped: Match[] = (Array.isArray(fmList) ? fmList : []).map((m: any) => ({
            id: String(m.id),
            phase: m.phase || 'Sin Fase',
            homeTeam: m.homeTeam ? { name: m.homeTeam.name, logo: m.homeTeam.logo } : null,
            awayTeam: m.awayTeam ? { name: m.awayTeam.name, logo: m.awayTeam.logo } : null,
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
            time: m.time ?? undefined,
            venue: m.venue ?? undefined,
            homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
            awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
            status: m.status === 'finished' ? 'finished' : 'scheduled',
          }));
          fMatches.push(...mapped);
        }
        setFeminineMatches(fMatches);
      } catch (err) {
        console.error('Error cargando torneos:', err);
        setMasculineTournaments([]);
        setMasculineMatches([]);
        setFeminineTournaments([]);
        setFeminineMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  return (
    <section className="tournaments-section">
      <div className="container">
        <h1 className="main-title">Todos los Torneos Disponibles</h1>

        {/* Masculino: card con logo+nombre+tabla */}
        <div className="tournament-category-section">
          <h2 className="category-title">Torneos Masculinos</h2>
          <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 16px' }}>
            {isLoading ? (
              <p>Cargando tabla de posiciones masculinas...</p>
            ) : masculineTournaments.length === 0 ? (
              <p>No hay torneos masculinos activos.</p>
            ) : (
              <div
                className="tournament-card"
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img
                    src={masculineTournaments[0]?.logo || '/images/default-tournament.png'}
                    alt={masculineTournaments[0]?.name || 'Torneo'}
                    style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{masculineTournaments[0]?.name || 'Torneo'}</h3>
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Tabla de Posiciones</span>
                  </div>
                </div>

                {masculineStandings.length > 0 ? (
                  <table className="standings-table" style={{ width: '100%', fontSize: '0.95rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Equipo</th>
                        <th>J</th>
                        <th>G</th>
                        <th>E</th>
                        <th>P</th>
                        <th>GF</th>
                        <th>GC</th>
                        <th>DG</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masculineStandings.map((s, idx) => (
                        <tr key={`m-${s.team.name}-${idx}`}>
                          <td>{idx + 1}</td>
                          <td>{s.team.name}</td>
                          <td>{s.played}</td>
                          <td>{s.wins}</td>
                          <td>{s.draws}</td>
                          <td>{s.losses}</td>
                          <td>{s.goalsFor}</td>
                          <td>{s.goalsAgainst}</td>
                          <td>{s.goalDiff}</td>
                          <td>{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ margin: '12px 0' }}>No hay posiciones disponibles.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Femenino: card con logo+nombre+tabla */}
        <div className="tournament-category-section">
          <h2 className="category-title">Torneos Femeninos</h2>
          <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 16px' }}>
            {isLoading ? (
              <p>Cargando tabla de posiciones femeninas...</p>
            ) : feminineTournaments.length === 0 ? (
              <p>No hay torneos femeninos activos.</p>
            ) : (
              <div
                className="tournament-card"
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img
                    src={feminineTournaments[0]?.logo || '/images/default-tournament.png'}
                    alt={feminineTournaments[0]?.name || 'Torneo'}
                    style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{feminineTournaments[0]?.name || 'Torneo'}</h3>
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Tabla de Posiciones</span>
                  </div>
                </div>

                {feminineStandings.length > 0 ? (
                  <table className="standings-table" style={{ width: '100%', fontSize: '0.95rem' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Equipo</th>
                        <th>J</th>
                        <th>G</th>
                        <th>E</th>
                        <th>P</th>
                        <th>GF</th>
                        <th>GC</th>
                        <th>DG</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feminineStandings.map((s, idx) => (
                        <tr key={`f-${s.team.name}-${idx}`}>
                          <td>{idx + 1}</td>
                          <td>{s.team.name}</td>
                          <td>{s.played}</td>
                          <td>{s.wins}</td>
                          <td>{s.draws}</td>
                          <td>{s.losses}</td>
                          <td>{s.goalsFor}</td>
                          <td>{s.goalsAgainst}</td>
                          <td>{s.goalDiff}</td>
                          <td>{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ margin: '12px 0' }}>No hay posiciones disponibles.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tournaments;