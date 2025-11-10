'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import apiService from '@/services/api';

// Tipos fuera del componente (evita conflictos del parser TSX)
interface Player {
  id: number;
  name: string;
  lastName?: string;
}
interface PlayerEvent {
  playerId: number;
  name: string;
  goals: number;
  fouls: number;
  yellow: boolean;
  red: boolean;
}

interface TeamBasic {
  id: number;
  name: string;
}

interface Match {
  id: string;
  homeTeam?: TeamBasic;
  awayTeam?: TeamBasic;
  venue?: string;
  date?: string;
  time?: string;
  group?: string;
  round?: number;
  homeScore?: number;
  awayScore?: number;
  goals?: string; // JSON string
  fouls?: string; // JSON string
  status: 'scheduled' | 'finished';
}

export default function AdminTournamentUpdatePage() {
  // Selección de torneo (si en tu app llega por contexto/props, reemplaza este estado)
  const [selectedTournament, setSelectedTournament] =
    useState<{ id: number; name: string } | null>(null);

  // Equipos y jugadores por equipo
  const [teamsById, setTeamsById] = useState<
    Record<number, { id: number; name: string; players: Player[] }>
  >({});

  // Estado de edición por partido
  const [editState, setEditState] = useState<
    Record<
      string,
      {
        homeScore: number;
        awayScore: number;
        goals?: string;
        fouls?: string;
        events?: { home: PlayerEvent[]; away: PlayerEvent[] };
      }
    >
  >({});

  // Partidos agrupados por fase
  const [scheduledMatches, setScheduledMatches] = useState<
    Record<string, Match[]>
  >({});

  // Cargar torneos y seleccionar uno al montar la página (elige el primero disponible)
  useEffect(() => {
    (async () => {
      if (selectedTournament) return;
      try {
        const token = apiService.getAccessToken();
        const res = await fetch('/api/tournaments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });
        const tournaments = await res.json();
        if (Array.isArray(tournaments) && tournaments.length > 0) {
          setSelectedTournament({
            id: Number(tournaments[0].id),
            name: String(tournaments[0].name),
          });
        } else {
          setScheduledMatches({});
        }
      } catch (err) {
        console.error(err);
        toast.error('No se pudieron cargar torneos');
      }
    })();
  }, [selectedTournament]);

  // Cargar partidos del torneo seleccionado y agrupar por fase
  useEffect(() => {
    (async () => {
      if (!selectedTournament) {
        setScheduledMatches({});
        return;
      }
      try {
        const token = apiService.getAccessToken();
        const res = await fetch(`/api/tournaments/${selectedTournament.id}/matches`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });
        const matches = await res.json();

        const grouped: Record<string, Match[]> = {};
        (matches || []).forEach((m: any) => {
          const phase = m.phase || 'General';
          const mapped: Match = {
            id: String(m.id),
            homeTeam: m.homeTeam ? { id: Number(m.homeTeam.id), name: m.homeTeam.name } : undefined,
            awayTeam: m.awayTeam ? { id: Number(m.awayTeam.id), name: m.awayTeam.name } : undefined,
            venue: m.venue ?? undefined,
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
            time: m.time ?? undefined,
            group: m.group ?? undefined,
            round: typeof m.round === 'number' ? m.round : undefined,
            homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
            awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
            goals: m.goals ?? undefined,
            fouls: m.fouls ?? undefined,
            status: m.status === 'finished' ? 'finished' : 'scheduled',
          };
          if (!grouped[phase]) grouped[phase] = [];
          grouped[phase].push(mapped);
        });

        setScheduledMatches(grouped);
      } catch (err) {
        console.error(err);
        toast.error('Error cargando partidos');
        setScheduledMatches({});
      }
    })();
  }, [selectedTournament]);

  // Cargar equipos y jugadores cuando haya torneo seleccionado
  useEffect(() => {
    (async () => {
      if (!selectedTournament) {
        setTeamsById({});
        return;
      }
      try {
        const token = apiService.getAccessToken();
        const res = await fetch(
          `/api/tournaments/admin/tournaments/${selectedTournament.id}/teams`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
          }
        );

        const teams: Array<{
          id: number;
          name: string;
          players: Array<{ id: number; name: string; lastName?: string }>;
        }> = await res.json();

        const map: Record<number, { id: number; name: string; players: Player[] }> = {};
        teams.forEach((t) => {
          map[t.id] = {
            id: t.id,
            name: t.name,
            players: (t.players || []).map((p) => ({
              id: p.id,
              name: p.name,
              lastName: p.lastName,
            })),
          };
        });
        setTeamsById(map);
      } catch (err) {
        console.error(err);
        toast.error('Error cargando equipos');
      }
    })();
  }, [selectedTournament]);

  // Inicializar eventos por jugador para un partido si no existen aún en el estado
  const ensureEventsForMatch = (
    m: Match
  ): { home: PlayerEvent[]; away: PlayerEvent[] } => {
    const current = editState[m.id]?.events;
    if (current) return current;

    const homePlayers = m.homeTeam?.id
      ? teamsById[Number(m.homeTeam.id)]?.players || []
      : [];
    const awayPlayers = m.awayTeam?.id
      ? teamsById[Number(m.awayTeam.id)]?.players || []
      : [];

    const home: PlayerEvent[] = homePlayers.map((p: Player) => ({
      playerId: p.id,
      name: [p.name, p.lastName].filter(Boolean).join(' '),
      goals: 0,
      fouls: 0,
      yellow: false,
      red: false,
    }));
    const away: PlayerEvent[] = awayPlayers.map((p: Player) => ({
      playerId: p.id,
      name: [p.name, p.lastName].filter(Boolean).join(' '),
      goals: 0,
      fouls: 0,
      yellow: false,
      red: false,
    }));

    setEditState((prev) => ({
      ...prev,
      [m.id]: {
        ...(prev[m.id] || {
          homeScore:
            typeof m.homeScore === 'number' ? m.homeScore : 0,
          awayScore:
            typeof m.awayScore === 'number' ? m.awayScore : 0,
        }),
        events: { home, away },
      },
    }));

    return { home, away };
  };

  // Guardar resultado y eventos por jugador
  const saveMatchResult = async (matchId: string, phase: string) => {
    const edit = editState[matchId] || { homeScore: 0, awayScore: 0 };
    const events = edit.events || { home: [], away: [] };

    const goalsPayload = JSON.stringify({
      home: events.home.map((p: PlayerEvent) => ({
        playerId: p.playerId,
        name: p.name,
        goals: p.goals,
        yellow: p.yellow,
        red: p.red,
      })),
      away: events.away.map((p: PlayerEvent) => ({
        playerId: p.playerId,
        name: p.name,
        goals: p.goals,
        yellow: p.yellow,
        red: p.red,
      })),
    });

    const foulsPayload = JSON.stringify({
      home: events.home.map((p: PlayerEvent) => ({
        playerId: p.playerId,
        name: p.name,
        fouls: p.fouls,
        yellow: p.yellow,
        red: p.red,
      })),
      away: events.away.map((p: PlayerEvent) => ({
        playerId: p.playerId,
        name: p.name,
        fouls: p.fouls,
        yellow: p.yellow,
        red: p.red,
      })),
    });

    try {
      const token = apiService.getAccessToken();
      await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          homeScore: Number(edit.homeScore),
          awayScore: Number(edit.awayScore),
          status: 'finished',
          goals: goalsPayload,
          fouls: foulsPayload,
        }),
      });

      setScheduledMatches((prev) => {
        const phaseMatches = prev[phase] || [];
        const newPhase: Match[] = phaseMatches.map((m) =>
          m.id === matchId
            ? { ...m, status: 'finished', homeScore: edit.homeScore, awayScore: edit.awayScore }
            : m
        );
        return { ...prev, [phase]: newPhase };
      });

      toast.success('Resultado actualizado');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo guardar el resultado');
    }
  };

  return (
    <div>
      {/* Selector de torneo (reemplaza por tu selector real si aplica) */}
      <div className="matches-by-phase">
        {Object.entries(scheduledMatches).map(([phase, phaseMatches]) => (
          <div key={phase} style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Fase: {phase}</h4>

            {/* Programados */}
            <div className="matches-block">
              <h6>Programados</h6>
              {(phaseMatches || [])
                .filter((m) => m.status === 'scheduled')
                .map((m) => (
                  <div
                    key={m.id}
                    className="match-card scheduled"
                    style={{ marginBottom: '1rem' }}
                  >
                    <div
                      className="match-header"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        {m.group ||
                          (m.round ? `Ronda ${m.round}` : '')}
                      </span>
                      <span className="status-indicator complete">
                        ✔ Programado
                      </span>
                    </div>

                    <div
                      className="match-teams"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <div className="team-slot home">
                        <span>
                          {m.homeTeam?.name || 'Local'}
                        </span>
                      </div>
                      <span className="vs-separator">VS</span>
                      <div className="team-slot away">
                        <span>
                          {m.awayTeam?.name || 'Visitante'}
                        </span>
                      </div>
                    </div>

                    <div
                      className="match-details"
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        marginTop: '0.75rem',
                      }}
                    >
                      <span>Cancha: {m.venue || '-'}</span>
                      <span>Fecha: {m.date || '-'}</span>
                      <span>Hora: {m.time || '-'}</span>
                    </div>

                    {/* Sección de edición: resultado y eventos por jugador */}
                    <div
                      className="match-edit"
                      style={{ marginTop: '0.75rem' }}
                    >
                      {/* Resultado simple */}
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Goles Local</label>
                          <input
                            type="number"
                            min={0}
                            value={editState[m.id]?.homeScore ?? 0}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [m.id]: {
                                  ...(prev[m.id] || { awayScore: 0 }),
                                  homeScore: Number(e.target.value),
                                  events:
                                    prev[m.id]?.events ?? ensureEventsForMatch(m),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Goles Visitante</label>
                          <input
                            type="number"
                            min={0}
                            value={editState[m.id]?.awayScore ?? 0}
                            onChange={(e) =>
                              setEditState((prev) => ({
                                ...prev,
                                [m.id]: {
                                  ...(prev[m.id] || { homeScore: 0 }),
                                  awayScore: Number(e.target.value),
                                  events:
                                    prev[m.id]?.events ?? ensureEventsForMatch(m),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>

                      {/* Eventos por jugador */}
                      <div
                        className="team-events"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1rem',
                          marginTop: '1rem',
                        }}
                      >
                        {/* Local */}
                        <div>
                          <h5>
                            Local: {m.homeTeam?.name || '-'}
                          </h5>
                          {(
                            editState[m.id]?.events ??
                            ensureEventsForMatch(m)
                          ).home.map((p, idx) => (
                            <div
                              key={`home-${p.playerId}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  '2fr repeat(4, 1fr)',
                                gap: '0.5rem',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <span>{p.name}</span>
                              <input
                                type="number"
                                min={0}
                                value={p.goals}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setEditState((prev) => {
                                    const events =
                                      prev[m.id]?.events ??
                                      ensureEventsForMatch(m);
                                    const nextHome = events.home.slice();
                                    nextHome[idx] = {
                                      ...nextHome[idx],
                                      goals: val,
                                    };
                                    return {
                                      ...prev,
                                      [m.id]: {
                                        ...(prev[m.id] || {
                                          homeScore: 0,
                                          awayScore: 0,
                                        }),
                                        events: {
                                          home: nextHome,
                                          away: events.away,
                                        },
                                      },
                                    };
                                  });
                                }}
                                placeholder="Goles"
                                title="Goles"
                              />
                              <input
                                type="number"
                                min={0}
                                value={p.fouls}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setEditState((prev) => {
                                    const events =
                                      prev[m.id]?.events ??
                                      ensureEventsForMatch(m);
                                    const nextHome = events.home.slice();
                                    nextHome[idx] = {
                                      ...nextHome[idx],
                                      fouls: val,
                                    };
                                    return {
                                      ...prev,
                                      [m.id]: {
                                        ...(prev[m.id] || {
                                          homeScore: 0,
                                          awayScore: 0,
                                        }),
                                        events: {
                                          home: nextHome,
                                          away: events.away,
                                        },
                                      },
                                    };
                                  });
                                }}
                                placeholder="Faltas"
                                title="Faltas"
                              />
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={p.yellow}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditState((prev) => {
                                      const events =
                                        prev[m.id]?.events ??
                                        ensureEventsForMatch(m);
                                      const nextHome = events.home.slice();
                                      nextHome[idx] = {
                                        ...nextHome[idx],
                                        yellow: checked,
                                      };
                                      return {
                                        ...prev,
                                        [m.id]: {
                                          ...(prev[m.id] || {
                                            homeScore: 0,
                                            awayScore: 0,
                                          }),
                                          events: {
                                            home: nextHome,
                                            away: events.away,
                                          },
                                        },
                                      };
                                    });
                                  }}
                                />
                                TA
                              </label>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={p.red}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditState((prev) => {
                                      const events =
                                        prev[m.id]?.events ??
                                        ensureEventsForMatch(m);
                                      const nextHome = events.home.slice();
                                      nextHome[idx] = {
                                        ...nextHome[idx],
                                        red: checked,
                                      };
                                      return {
                                        ...prev,
                                        [m.id]: {
                                          ...(prev[m.id] || {
                                            homeScore: 0,
                                            awayScore: 0,
                                          }),
                                          events: {
                                            home: nextHome,
                                            away: events.away,
                                          },
                                        },
                                      };
                                    });
                                  }}
                                />
                                TR
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Visitante */}
                        <div>
                          <h5>Visitante: {m.awayTeam?.name || '-'}</h5>
                          {(
                            editState[m.id]?.events ??
                            ensureEventsForMatch(m)
                          ).away.map((p, idx) => (
                            <div
                              key={`away-${p.playerId}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  '2fr repeat(4, 1fr)',
                                gap: '0.5rem',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <span>{p.name}</span>
                              <input
                                type="number"
                                min={0}
                                value={p.goals}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setEditState((prev) => {
                                    const events =
                                      prev[m.id]?.events ??
                                      ensureEventsForMatch(m);
                                    const nextAway = events.away.slice();
                                    nextAway[idx] = {
                                      ...nextAway[idx],
                                      goals: val,
                                    };
                                    return {
                                      ...prev,
                                      [m.id]: {
                                        ...(prev[m.id] || {
                                          homeScore: 0,
                                          awayScore: 0,
                                        }),
                                        events: {
                                          home: events.home,
                                          away: nextAway,
                                        },
                                      },
                                    };
                                  });
                                }}
                                placeholder="Goles"
                                title="Goles"
                              />
                              <input
                                type="number"
                                min={0}
                                value={p.fouls}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setEditState((prev) => {
                                    const events =
                                      prev[m.id]?.events ??
                                      ensureEventsForMatch(m);
                                    const nextAway = events.away.slice();
                                    nextAway[idx] = {
                                      ...nextAway[idx],
                                      fouls: val,
                                    };
                                    return {
                                      ...prev,
                                      [m.id]: {
                                        ...(prev[m.id] || {
                                          homeScore: 0,
                                          awayScore: 0,
                                        }),
                                        events: {
                                          home: events.home,
                                          away: nextAway,
                                        },
                                      },
                                    };
                                  });
                                }}
                                placeholder="Faltas"
                                title="Faltas"
                              />
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={p.yellow}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditState((prev) => {
                                      const events =
                                        prev[m.id]?.events ??
                                        ensureEventsForMatch(m);
                                      const nextAway = events.away.slice();
                                      nextAway[idx] = {
                                        ...nextAway[idx],
                                        yellow: checked,
                                      };
                                      return {
                                        ...prev,
                                        [m.id]: {
                                          ...(prev[m.id] || {
                                            homeScore: 0,
                                            awayScore: 0,
                                          }),
                                          events: {
                                            home: events.home,
                                            away: nextAway,
                                          },
                                        },
                                      };
                                    });
                                  }}
                                />
                                TA
                              </label>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={p.red}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditState((prev) => {
                                      const events =
                                        prev[m.id]?.events ??
                                        ensureEventsForMatch(m);
                                      const nextAway = events.away.slice();
                                      nextAway[idx] = {
                                        ...nextAway[idx],
                                        red: checked,
                                      };
                                      return {
                                        ...prev,
                                        [m.id]: {
                                          ...(prev[m.id] || {
                                            homeScore: 0,
                                            awayScore: 0,
                                          }),
                                          events: {
                                            home: events.home,
                                            away: nextAway,
                                          },
                                        },
                                      };
                                    });
                                  }}
                                />
                                TR
                              </label>
                            </div>
                          ))}

                          <div style={{ marginTop: '0.75rem' }}>
                            <button
                              onClick={() => saveMatchResult(m.id, phase)}
                              style={{ padding: '0.5rem 1rem' }}
                            >
                              Guardar resultado
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Finalizados */}
              {(phaseMatches || [])
                .filter((m) => m.status === 'finished')
                .map((m) => (
                  <div
                    key={m.id}
                    className="match-card finished"
                    style={{ marginBottom: '1rem' }}
                  >
                    <div
                      className="match-header"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        {m.group ||
                          (m.round ? `Ronda ${m.round}` : '')}
                      </span>
                      <span className="status-indicator complete">
                        ✔ Finalizado
                      </span>
                    </div>

                    <div
                      className="match-teams"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <div className="team-slot home">
                        <span>
                          {m.homeTeam?.name || 'Local'}
                        </span>
                      </div>
                      <span className="vs-separator">VS</span>
                      <div className="team-slot away">
                        <span>
                          {m.awayTeam?.name || 'Visitante'}
                        </span>
                      </div>
                    </div>

                    <div
                      className="match-details"
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        marginTop: '0.75rem',
                      }}
                    >
                      <span>Cancha: {m.venue || '-'}</span>
                      <span>Fecha: {m.date || '-'}</span>
                      <span>Hora: {m.time || '-'}</span>
                    </div>

                    <div
                      className="match-result-display"
                      style={{ marginTop: '0.75rem' }}
                    >
                      <strong>Resultado:</strong>{' '}
                      {m.homeScore} - {m.awayScore}
                      {!!m.goals && (
                        <div>
                          <strong>Goles:</strong>
                          <pre style={{ whiteSpace: 'pre-wrap' }}>
                            {m.goals}
                          </pre>
                        </div>
                      )}
                      {!!m.fouls && (
                        <div>
                          <strong>Faltas:</strong>
                          <pre style={{ whiteSpace: 'pre-wrap' }}>
                            {m.fouls}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}