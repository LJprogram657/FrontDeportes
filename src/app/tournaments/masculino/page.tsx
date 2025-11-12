'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  goals?: string; // JSON con goles por jugador (home/away) desde la API
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

function computeStandings(matches: Match[]): Standing[] {
  const teams = new Map<string, { name: string; logo?: string | null }>();
  const stats = new Map<
    string,
    {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
      logo?: string | null;
    }
  >();

  for (const m of matches) {
    const homeName = m.homeTeam?.name;
    const awayName = m.awayTeam?.name;
    const homeLogo = m.homeTeam?.logo ?? null;
    const awayLogo = m.awayTeam?.logo ?? null;

    if (homeName) {
      teams.set(homeName, { name: homeName, logo: homeLogo });
      if (!stats.has(homeName)) {
        stats.set(homeName, {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          logo: homeLogo,
        });
      }
    }
    if (awayName) {
      teams.set(awayName, { name: awayName, logo: awayLogo });
      if (!stats.has(awayName)) {
        stats.set(awayName, {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          logo: awayLogo,
        });
      }
    }

    if (m.status === 'finished' && typeof m.homeScore === 'number' && typeof m.awayScore === 'number') {
      if (homeName) {
        const s = stats.get(homeName)!;
        s.played += 1;
        s.goalsFor += m.homeScore;
        s.goalsAgainst += m.awayScore;
        if (m.homeScore > m.awayScore) {
          s.wins += 1;
          s.points += 3;
        } else if (m.homeScore === m.awayScore) {
          s.draws += 1;
          s.points += 1;
        } else {
          s.losses += 1;
        }
      }
      if (awayName) {
        const s = stats.get(awayName)!;
        s.played += 1;
        s.goalsFor += m.awayScore;
        s.goalsAgainst += m.homeScore;
        if (m.awayScore > m.homeScore) {
          s.wins += 1;
          s.points += 3;
        } else if (m.awayScore === m.homeScore) {
          s.draws += 1;
          s.points += 1;
        } else {
          s.losses += 1;
        }
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

const MasculinoPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playerPhotos, setPlayerPhotos] = useState<Record<number, string>>({}); // NUEVO

  const standings = useMemo<Standing[]>(() => computeStandings(matches), [matches]);

  // Cálculo del equipo con la valla menos vencida (menor GC)
  const bestDefense = useMemo(() => {
    if (!standings.length) return null;
    const copy = [...standings];
    copy.sort((a, b) => {
      if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDiff - a.goalDiff;
    });
    return copy[0];
  }, [standings]);

  // Próximos partidos (status = scheduled)
  const upcomingMatches = useMemo(() => matches.filter((m) => m.status === 'scheduled').slice(0, 8), [matches]);

  function safeParseGoals(raw?: string): {
    home: Array<{ playerId?: number; name?: string; goals?: number }>;
    away: Array<{ playerId?: number; name?: string; goals?: number }>;
  } {
    if (!raw) return { home: [], away: [] };
    try {
      const parsed = JSON.parse(raw);
      const home = Array.isArray(parsed?.home) ? parsed.home : [];
      const away = Array.isArray(parsed?.away) ? parsed.away : [];
      return { home, away };
    } catch {
      return { home: [], away: [] };
    }
  }

  // Máximo goleador desde partidos finalizados
  const topScorer = useMemo(() => {
    const goalsByPlayer = new Map<string, { playerId?: number; name: string; team: string; goals: number }>();

    for (const m of matches) {
      if (m.status !== 'finished') continue;
      const { home, away } = safeParseGoals(m.goals);

      const homeTeamName = m.homeTeam?.name || 'Local';
      for (const ev of home) {
        const pid = typeof ev.playerId === 'number' ? ev.playerId : undefined;
        const pname = ev.name || 'Jugador';
        const key = pid ? `id:${pid}` : `name:${pname}|team:${homeTeamName}`;
        const prev = goalsByPlayer.get(key);
        goalsByPlayer.set(key, {
          playerId: pid,
          name: pname,
          team: homeTeamName,
          goals: (prev?.goals || 0) + (ev.goals || 0),
        });
      }

      const awayTeamName = m.awayTeam?.name || 'Visitante';
      for (const ev of away) {
        const pid = typeof ev.playerId === 'number' ? ev.playerId : undefined;
        const pname = ev.name || 'Jugador';
        const key = pid ? `id:${pid}` : `name:${pname}|team:${awayTeamName}`;
        const prev = goalsByPlayer.get(key);
        goalsByPlayer.set(key, {
          playerId: pid,
          name: pname,
          team: awayTeamName,
          goals: (prev?.goals || 0) + (ev.goals || 0),
        });
      }
    }

    let leader: { playerId?: number; name: string; team: string; goals: number } | null = null;
    for (const value of goalsByPlayer.values()) {
      if (!leader || value.goals > leader.goals) {
        leader = value;
      }
    }
    return leader;
  }, [matches]);

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
          category: 'masculino',
          modality: t.modality === 'futbol7' ? 'futbol7' : 'futsal',
          status: String(t.status || 'active'),
          startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : undefined,
          endDate: t.end_date ? new Date(t.end_date).toISOString().slice(0, 10) : undefined,
          description: t.description ?? undefined,
        }));
        setTournaments(masculineTournaments);

        // NUEVO: cargar fotos de jugadores por torneo
        const photos: Record<number, string> = {};
        for (const t of masculineTournaments) {
          const teamsRes = await fetch(`/api/tournaments/${t.id}/teams`, { cache: 'no-store' });
          if (teamsRes.ok) {
            const teams = await teamsRes.json();
            for (const team of teams as Array<{ players: Array<{ id: number; photo?: string }> }>) {
              for (const p of team.players || []) {
                if (typeof p.id === 'number' && p.photo) {
                  photos[p.id] = p.photo;
                }
              }
            }
          }
        }
        setPlayerPhotos(photos);

        const allMatches: Match[] = [];
        for (const t of masculineTournaments) {
          const mRes = await fetch(`/api/tournaments/${t.id}/matches`, { cache: 'no-store' });
          if (!mRes.ok) continue;
          const mList = await mRes.json();
          const mapped: Match[] = (Array.isArray(mList) ? mList : []).map((m: any) => ({
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
            goals: typeof m.goals === 'string' ? m.goals : undefined,
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

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 16px' }}>
        {tournaments.length === 0 ? (
          <div className="no-tournaments">
            <p>No hay torneos masculinos disponibles en este momento.</p>
            <p>Los torneos aparecerán aquí una vez que el administrador los cree.</p>
          </div>
        ) : (
          <>
            <div className="tournament-card" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img
                  src={tournaments[0]?.logo || '/images/default-tournament.png'}
                  alt={tournaments[0]?.name || 'Torneo'}
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }}
                />
                <div>
                  <h2 style={{ margin: 0 }}>{tournaments[0]?.name || 'Torneo'}</h2>
                  <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Tabla de Posiciones</span>
                </div>
              </div>

              {standings.length > 0 ? (
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
                    {standings.map((s, idx) => (
                      <tr key={`${s.team.name}-${idx}`}>
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

              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px' }}>
                  <h3 style={{ margin: 0, marginBottom: '8px' }}>Máximo Goleador</h3>
                  {topScorer ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={(topScorer.playerId && playerPhotos[topScorer.playerId]) ? playerPhotos[topScorer.playerId] : '/images/default-avatar.png'}
                        alt={topScorer.name}
                        style={{ width: '40px', height: '40px', borderRadius: '9999px', objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 600 }}>{topScorer.name}</span>
                      <span style={{ opacity: 0.85 }}>
                        ({topScorer.team}) — {topScorer.goals} gol{topScorer.goals === 1 ? '' : 'es'}
                      </span>
                    </div>
                  ) : (
                    <p style={{ margin: 0, opacity: 0.8 }}>No hay datos de goleadores disponibles aún.</p>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px' }}>
                  <h3 style={{ margin: 0, marginBottom: '8px' }}>Valla menos vencida</h3>
                  {bestDefense ? (
                    <p style={{ margin: 0 }}>
                      {bestDefense.team.name}
                    </p>
                  ) : (
                    <p style={{ margin: 0, opacity: 0.8 }}>Aún no hay suficiente información.</p>
                  )}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px' }}>
                  <h3 style={{ margin: 0, marginBottom: '8px' }}>Próximos Partidos</h3>
                  {upcomingMatches.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {upcomingMatches.map((m) => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ opacity: 0.9 }}>
                            {m.homeTeam?.name || 'Local'} vs {m.awayTeam?.name || 'Visitante'}
                          </span>
                          <span style={{ opacity: 0.7 }}>
                            {m.date ?? 'Sin fecha'} {m.time ? `— ${m.time}` : ''} {m.venue ? `@ ${m.venue}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, opacity: 0.8 }}>No hay partidos programados próximos.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MasculinoPage;