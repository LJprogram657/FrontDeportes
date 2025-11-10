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
  // Selección de torneo
  const [selectedTournament, setSelectedTournament] =
    useState<{ id: number; name: string } | null>(null);

  // Listado de torneos (vista inicial con logos)
  interface TournamentSummary {
    id: number;
    name: string;
    logo?: string | null;
    status?: string;
  }
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState<boolean>(false);

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

  // Cargar torneos y mostrar cuadrícula de logos
  useEffect(() => {
    (async () => {
      setIsLoadingTournaments(true);
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
        const list = await res.json();
        if (Array.isArray(list)) {
          setTournaments(
            list.map((t: any) => ({
              id: Number(t.id),
              name: String(t.name),
              logo: t.logo || null,
              status: t.status,
            }))
          );
        } else {
          setTournaments([]);
        }
      } catch (err) {
        console.error(err);
        toast.error('No se pudieron cargar torneos');
        setTournaments([]);
      } finally {
        setIsLoadingTournaments(false);
      }
    })();
  }, []);

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

  // Paleta y sombras (solo estilos)
  const ui = {
    color: {
      primary: '#c8102e',       // rojo del header
      surface: '#ffffff',
      text: '#222',
      muted: '#6b7280',
      border: '#e5e7eb',
      successBg: '#e8fff0',
      successText: '#0f5132',
      scheduledBg: '#f8fafc',
    },
    shadow: '0 6px 16px rgba(0,0,0,0.08)',
    radius: '12px',
  };

  // Helpers de presentación (solo visuales)
  const parseEvents = (
    input?: string
  ): { home: any[]; away: any[] } => {
    if (!input) return { home: [], away: [] };
    try {
      const obj = JSON.parse(input);
      const home = Array.isArray(obj?.home) ? obj.home : [];
      const away = Array.isArray(obj?.away) ? obj.away : [];
      return { home, away };
    } catch {
      return { home: [], away: [] };
    }
  };

  const formatEventItem = (ev: any): string => {
    const name =
      ev?.name ??
      ev?.playerName ??
      (ev?.playerId != null ? `Jugador ${ev.playerId}` : 'Jugador');
    const parts: string[] = [];
    if (typeof ev?.goals === 'number' && ev.goals > 0) parts.push(`⚽ ${ev.goals} gol(es)`);
    if (typeof ev?.fouls === 'number' && ev.fouls > 0) parts.push(`⛔ ${ev.fouls} falta(s)`);
    if (ev?.yellow) parts.push('🟨 TA');
    if (ev?.red) parts.push('🟥 TR');
    return parts.length ? `${name} — ${parts.join(' · ')}` : name;
  };

  function RenderEventBlock({
    label,
    data,
    homeName,
    awayName,
  }: {
    label: string;
    data: { home: any[]; away: any[] };
    homeName: string;
    awayName: string;
  }) {
    return (
      <div style={{ marginTop: '0.5rem' }}>
        <strong>{label}:</strong>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginTop: '0.25rem',
          }}
        >
          <div>
            <em style={{ color: '#555' }}>{homeName}</em>
            {data.home.length === 0 ? (
              <div>Ninguno</div>
            ) : (
              <ul style={{ margin: '0.25rem 0', paddingLeft: '1rem' }}>
                {data.home.map((ev, i) => (
                  <li key={`h-${i}`}>{formatEventItem(ev)}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <em style={{ color: '#555' }}>{awayName}</em>
            {data.away.length === 0 ? (
              <div>Ninguno</div>
            ) : (
              <ul style={{ margin: '0.25rem 0', paddingLeft: '1rem' }}>
                {data.away.map((ev, i) => (
                  <li key={`a-${i}`}>{formatEventItem(ev)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Vista inicial: cuadrícula de logos de torneos */}
      {!selectedTournament && (
        <div>
          <h3>Selecciona un torneo</h3>
          {isLoadingTournaments ? (
            <p>Cargando torneos...</p>
          ) : (
            <div
              className="tournaments-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="tournament-card"
                  onClick={() => setSelectedTournament({ id: t.id, name: t.name })}
                  style={{
                    cursor: 'pointer',
                    border: `1px solid ${ui.color.border}`,
                    borderRadius: ui.radius,
                    padding: '1rem',
                    background: ui.color.surface,
                    boxShadow: ui.shadow,
                    transition: 'transform .15s ease, box-shadow .15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                  title={`Abrir ${t.name}`}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = ui.shadow;
                  }}
                >
                  <div
                    className="tournament-logo"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '120px',
                      width: '100%',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <img
                      src={t.logo || '/images/logo.png'}
                      alt={t.name}
                      style={{
                        maxWidth: '100px',
                        maxHeight: '100px',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>
                  <div className="tournament-info" style={{ textAlign: 'center', color: ui.color.text }}>
                    <strong>{t.name}</strong>
                  </div>
                </div>
              ))}
              {tournaments.length === 0 && (
                <p>No hay torneos creados aún.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vista de partidos: se muestra al seleccionar un torneo */}
      {selectedTournament && (
        <div className="matches-by-phase">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <button onClick={() => setSelectedTournament(null)} style={{ padding: '0.4rem 0.8rem' }}>
              ← Volver a torneos
            </button>
            <h3 style={{ margin: 0 }}>{selectedTournament.name}</h3>
          </div>

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
                      style={{
                        marginBottom: '1rem',
                        border: `1px solid ${ui.color.border}`,
                        borderRadius: ui.radius,
                        background: ui.color.scheduledBg,
                        boxShadow: ui.shadow,
                        padding: '1rem',
                      }}
                    >
                      <div
                        className="match-header"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span style={{ color: ui.color.muted }}>
                          {m.group ||
                            (m.round ? `Ronda ${m.round}` : '')}
                        </span>
                        <span
                          className="status-indicator complete"
                          style={{
                            background: '#eef2ff',
                            color: '#3730a3',
                            borderRadius: '999px',
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          ✔ Programado
                        </span>
                      </div>

                      <div
                        className="match-teams"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          fontWeight: 600,
                          color: ui.color.text,
                        }}
                      >
                        <div className="team-slot home">
                          <span>
                            {m.homeTeam?.name || 'Local'}
                          </span>
                        </div>
                        <span
                          className="vs-separator"
                          style={{
                            background: '#f1f5f9',
                            border: `1px solid ${ui.color.border}`,
                            borderRadius: '999px',
                            padding: '0.1rem 0.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          VS
                        </span>
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
                          marginTop: '0.5rem',
                          color: ui.color.muted,
                          fontSize: '0.9rem',
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
                  .map((m) => {
                    const goalsData = parseEvents(m.goals);
                    const foulsData = parseEvents(m.fouls);
                    return (
                      <div
                        key={m.id}
                        className="match-card finished"
                        style={{
                          marginBottom: '1rem',
                          border: `1px solid ${ui.color.border}`,
                          borderRadius: ui.radius,
                          background: ui.color.surface,
                          boxShadow: ui.shadow,
                          padding: '1rem',
                        }}
                      >
                        <div
                          className="match-header"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span style={{ color: ui.color.muted }}>
                            {m.group ||
                              (m.round ? `Ronda ${m.round}` : '')}
                          </span>
                          <span
                            className="status-indicator complete"
                            style={{
                              background: ui.color.successBg,
                              color: ui.color.successText,
                              borderRadius: '999px',
                              padding: '0.15rem 0.5rem',
                              fontSize: '0.85rem',
                            }}
                          >
                            ✔ Finalizado
                          </span>
                        </div>

                        <div
                          className="match-teams"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontWeight: 600,
                            color: ui.color.text,
                          }}
                        >
                          <div className="team-slot home">
                            <span>
                              {m.homeTeam?.name || 'Local'}
                            </span>
                          </div>
                          <span
                            className="vs-separator"
                            style={{
                              background: '#f1f5f9',
                              border: `1px solid ${ui.color.border}`,
                              borderRadius: '999px',
                              padding: '0.1rem 0.5rem',
                              fontSize: '0.85rem',
                            }}
                          >
                            VS
                          </span>
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
                            marginTop: '0.5rem',
                            color: ui.color.muted,
                            fontSize: '0.9rem',
                          }}
                        >
                          <span>Cancha: {m.venue || '-'}</span>
                          <span>Fecha: {m.date || '-'}</span>
                          <span>Hora: {m.time || '-'}</span>
                        </div>

                        <div
                          className="match-result-display"
                          style={{
                            marginTop: '0.75rem',
                            display: 'grid',
                            gridTemplateColumns: '140px 1fr',
                            gap: '1rem',
                            alignItems: 'start',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${ui.color.border}`,
                              borderRadius: ui.radius,
                              padding: '0.75rem',
                              background: '#f8fafc',
                              fontWeight: 700,
                              fontSize: '1.6rem',
                              color: ui.color.text,
                            }}
                          >
                            {m.homeScore} — {m.awayScore}
                          </div>

                          <div>
                            <RenderEventBlock
                              label="Goles"
                              data={goalsData}
                              homeName={m.homeTeam?.name || 'Local'}
                              awayName={m.awayTeam?.name || 'Visitante'}
                            />
                            <RenderEventBlock
                              label="Faltas"
                              data={foulsData}
                              homeName={m.homeTeam?.name || 'Local'}
                              awayName={m.awayTeam?.name || 'Visitante'}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}