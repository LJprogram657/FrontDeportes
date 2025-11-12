'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

interface Tournament {
  id: number;
  name: string;
  logo: string | null;
}

interface TeamRef {
  id: number | null;
  name: string | null;
  logo: string | null;
}

type MatchStatus = 'scheduled' | 'finished' | 'canceled' | 'postponed';

interface Match {
  id: number;
  tournamentId: number;
  phase?: string | null;
  venue?: string | null;
  date?: string | null;
  time?: string | null;
  round?: string | null;
  group?: string | null;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  goals?: string | null; // JSON string con eventos de goles
  fouls?: string | null;
  homeTeam?: TeamRef | null;
  awayTeam?: TeamRef | null;
}

interface Standing {
  teamId: number;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

const computeStandings = (matches: Match[]): Standing[] => {
  const table = new Map<number, Standing>();

  const addTeamIfMissing = (team?: TeamRef | null) => {
    if (!team?.id || !team?.name) return;
    if (!table.has(team.id)) {
      table.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      });
    }
  };

  matches
    .filter(m => m.status === 'finished')
    .forEach(m => {
      addTeamIfMissing(m.homeTeam);
      addTeamIfMissing(m.awayTeam);

      const homeId = m.homeTeam?.id ?? null;
      const awayId = m.awayTeam?.id ?? null;
      const hs = m.homeScore ?? null;
      const as = m.awayScore ?? null;

      if (homeId == null || awayId == null || hs == null || as == null) return;

      const home = table.get(homeId)!;
      const away = table.get(awayId)!;

      home.played += 1;
      away.played += 1;

      home.goalsFor += hs;
      home.goalsAgainst += as;
      away.goalsFor += as;
      away.goalsAgainst += hs;

      if (hs > as) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (hs < as) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  const list = Array.from(table.values()).map(s => ({
    ...s,
    goalDiff: s.goalsFor - s.goalsAgainst,
  }));

  return list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
};

const FemeninoPage = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [playersMap, setPlayersMap] = useState<
    Record<number, { name: string; lastName: string; photo: string | null; teamName: string }>
  >({});

  // Cargar torneos activos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tournaments/active?category=femenino');
        const active = await res.json();
        const ts: Tournament[] = (active || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          logo: t.logo ?? null,
        }));
        if (!mounted) return;
        setTournaments(ts);
        setSelectedTournamentId(ts[0]?.id ?? null);
      } catch (e) {
        console.error('Error cargando torneos activos (femenino):', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar partidos del torneo seleccionado
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedTournamentId) return;
      try {
        setLoading(true);
        const mRes = await fetch(`/api/tournaments/${selectedTournamentId}/matches`);
        const m = await mRes.json();
        const normalized: Match[] = (m || []).map((x: any) => ({
          id: x.id,
          tournamentId: x.tournamentId,
          phase: x.phase ?? null,
          venue: x.venue ?? null,
          date: x.date ?? null,
          time: x.time ?? null,
          round: x.round ?? null,
          group: x.group ?? null,
          status: x.status,
          homeScore: x.homeScore ?? null,
          awayScore: x.awayScore ?? null,
          goals: x.goals ?? null,
          fouls: x.fouls ?? null,
          homeTeam: x.homeTeam ? { id: x.homeTeam.id, name: x.homeTeam.name, logo: x.homeTeam.logo } : null,
          awayTeam: x.awayTeam ? { id: x.awayTeam.id, name: x.awayTeam.name, logo: x.awayTeam.logo } : null,
        }));
        if (!mounted) return;
        setMatches(normalized);
      } catch (e) {
        console.error('Error cargando partidos (femenino):', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedTournamentId]);

  // Cargar equipos + jugadores para obtener fotos del goleador
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedTournamentId) return;
      try {
        const tRes = await fetch(`/api/tournaments/${selectedTournamentId}/teams`);
        const teams = await tRes.json();
        const map: Record<number, { name: string; lastName: string; photo: string | null; teamName: string }> = {};
        (teams || []).forEach((team: any) => {
          (team.players || []).forEach((p: any) => {
            map[p.id] = { name: p.name, lastName: p.lastName, photo: p.photo ?? null, teamName: team.name };
          });
        });
        if (!mounted) return;
        setPlayersMap(map);
      } catch (e) {
        console.warn('No se pudo cargar jugadores (femenino):', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedTournamentId]);

  const standings = useMemo<Standing[]>(() => computeStandings(matches), [matches]);

  const bestDefense = useMemo(() => {
    if (!standings.length) return null;
    const sorted = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.points - a.points);
    const top = sorted[0];
    return top ? { teamName: top.teamName, goalsAgainst: top.goalsAgainst } : null;
  }, [standings]);

  const upcomingMatches = useMemo(
    () => matches.filter(m => m.status === 'scheduled').sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    [matches]
  );

  const safeParseGoals = (json: string | null | undefined): any[] => {
    if (!json) return [];
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const topScorer = useMemo(() => {
    const goalsByPlayer: Record<
      string,
      { goals: number; playerId?: number; name: string; team: string; photo?: string | null }
    > = {};

    matches
      .filter(m => m.status === 'finished' && !!m.goals)
      .forEach(m => {
        const events = safeParseGoals(m.goals);
        events.forEach((ev: any) => {
          const key =
            ev.playerId != null ? `id:${ev.playerId}` : `${(ev.name ?? '').toLowerCase()}|${(ev.team ?? '').toLowerCase()}`;
          if (!goalsByPlayer[key]) {
            const pm = ev.playerId != null ? playersMap[ev.playerId] : null;
            goalsByPlayer[key] = {
              goals: 0,
              playerId: ev.playerId,
              name: pm ? `${pm.name} ${pm.lastName}` : (ev.name ?? 'Jugador'),
              team: pm ? pm.teamName : (ev.team ?? 'Equipo'),
              photo: pm?.photo ?? null,
            };
          }
          goalsByPlayer[key].goals += 1;
        });
      });

    const best = Object.values(goalsByPlayer).sort((a, b) => b.goals - a.goals)[0];
    return best ?? null;
  }, [matches, playersMap]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="rounded-lg px-4 py-3 bg-black/30 text-white">Cargando torneos...</div>
      </div>
    );
  }

  if (!tournaments.length || !selectedTournamentId) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="rounded-lg px-4 py-3 bg-black/30 text-white">No hay torneos femeninos activos.</div>
      </div>
    );
  }

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId)!;

  return (
    <div className="min-h-screen px-4 md:px-0">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Torneos Femeninos</h1>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm shadow-[0_0_12px_rgba(147,51,234,0.15)] overflow-hidden">
          {/* Encabezado */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10">
            <div className="relative h-10 w-10 rounded-md overflow-hidden ring-1 ring-white/20">
              {selectedTournament.logo ? (
                <Image src={selectedTournament.logo} alt={selectedTournament.name} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-white/10" />
              )}
            </div>
            <div>
              <div className="text-white font-semibold">{selectedTournament.name}</div>
              <div className="text-xs text-gray-300">Tabla de Posiciones</div>
            </div>
          </div>

          {/* Tabla de posiciones */}
          <div className="px-3 py-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-300">
                  <tr>
                    <th className="py-2">#</th>
                    <th className="py-2">Equipo</th>
                    <th className="py-2">J</th>
                    <th className="py-2">G</th>
                    <th className="py-2">E</th>
                    <th className="py-2">P</th>
                    <th className="py-2">GF</th>
                    <th className="py-2">GC</th>
                    <th className="py-2">DG</th>
                    <th className="py-2">Pts</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {standings.length ? (
                    standings.map((s, idx) => (
                      <tr key={s.teamId} className="border-t border-white/10">
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2">{s.teamName}</td>
                        <td className="py-2">{s.played}</td>
                        <td className="py-2">{s.wins}</td>
                        <td className="py-2">{s.draws}</td>
                        <td className="py-2">{s.losses}</td>
                        <td className="py-2">{s.goalsFor}</td>
                        <td className="py-2">{s.goalsAgainst}</td>
                        <td className="py-2">{s.goalDiff}</td>
                        <td className="py-2">{s.points}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 text-gray-400" colSpan={10}>
                        No hay datos de posiciones aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Máximo Goleador */}
          <div className="px-3 py-2 border-t border-white/10">
            <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
              <div className="text-sm font-semibold mb-2 tracking-wide text-purple-300">Máximo Goleador</div>
              {topScorer ? (
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden ring-1 ring-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                    {topScorer.photo ? (
                      <Image src={topScorer.photo as string} alt={topScorer.name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center bg-gradient-to-br from-purple-700 to-blue-700 text-white">
                        <span className="text-sm font-bold">
                          {topScorer.name
                            .split(' ')
                            .slice(0, 2)
                            .map((s: string) => s[0]?.toUpperCase())
                            .join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-white">{topScorer.name}</span>
                    <span className="text-gray-300"> ({topScorer.team})</span>
                    <span className="ml-2 text-purple-300">
                      — {topScorer.goals} gol{(topScorer.goals ?? 0) > 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Sin datos de goles todavía.</div>
              )}
            </div>
          </div>

          {/* Valla menos vencida — solo nombre */}
          <div className="px-3 py-2 border-t border-white/10">
            <div className="rounded-md bg-white/5 p-2 ring-1 ring-white/10">
              <div className="text-sm font-semibold mb-2 tracking-wide text-blue-300">Valla menos vencida</div>
              {bestDefense ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-5 w-5 rounded-full bg-blue-600/40 ring-1 ring-blue-400/60 shadow-[0_0_6px_rgba(59,130,246,0.35)] grid place-items-center text-white">
                    🛡️
                  </span>
                  <span className="font-semibold text-white">{bestDefense.teamName}</span>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Sin datos suficientes.</div>
              )}
            </div>
          </div>

          {/* Próximos Partidos */}
          <div className="px-3 py-2 border-t border-white/10">
            <div className="rounded-md bg白/5 p-2 ring-1 ring-white/10">
              <div className="text-sm font-semibold mb-2 tracking-wide text-rose-300">Próximos Partidos</div>
              {upcomingMatches.length ? (
                <div className="grid gap-2">
                  {upcomingMatches.slice(0, 6).map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 rounded-md overflow-hidden ring-1 ring-white/20">
                          {m.homeTeam?.logo ? (
                            <Image
                              src={m.homeTeam.logo as string}
                              alt={m.homeTeam?.name ?? 'Local'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-white/10" />
                          )}
                        </div>
                        <span className="text-sm text-white font-medium">{m.homeTeam?.name ?? 'Local'}</span>
                      </div>

                      <span className="text-[10px] font-bold tracking-widest text-gray-200">VS</span>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">{m.awayTeam?.name ?? 'Visitante'}</span>
                        <div className="relative h-6 w-6 rounded-md overflow-hidden ring-1 ring-white/20">
                          {m.awayTeam?.logo ? (
                            <Image
                              src={m.awayTeam.logo as string}
                              alt={m.awayTeam?.name ?? 'Visitante'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-white/10" />
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-300">
                        {(m.date && new Date(m.date).toLocaleDateString()) || 'Fecha por definir'} {' • '}
                        {m.time || 'Hora por definir'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No hay partidos programados próximos.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FemeninoPage;