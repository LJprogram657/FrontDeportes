'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import '../../../styles/tournament-form.css';

type TeamRef = { id: string; name: string; logo: string };

interface Match {
  id: string;
  phase: string;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  date?: string;
  time?: string;
  venue?: string;
  round?: number;
  group?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'finished';
  goals?: string;
  fouls?: string;
}

interface Tournament {
  id: number;
  name: string;
  description: string;
  sport: string;
  category: 'masculino' | 'femenino';
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  location: string;
  format: string;
  prizePool: string;
  status: 'active' | 'upcoming' | 'completed';
  phases?: ('round_robin' | 'group_stage' | 'quarterfinals' | 'semifinals' | 'final')[];
  logo?: string;
  origin?: 'created' | 'mock';
  modality?: 'futsal' | 'futbol7';
}

export default function AdminTournamentUpdatePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Eliminar lectura de 'admin_created_tournaments' en localStorage:
  // const key = 'admin_created_tournaments';
  // const created = JSON.parse(localStorage.getItem(key) || '[]');

  const [created, setCreated] = useState<any[]>([]);

  useEffect(() => {
    // Cargar desde la API en lugar de localStorage
    fetch('/api/tournaments', { headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(data => setCreated(Array.isArray(data?.tournaments) ? data.tournaments : []))
      .catch(() => setCreated([]));
  }, []);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const key = 'admin_created_tournaments';
    const created = JSON.parse(localStorage.getItem(key) || '[]');
    const withPhases = created.map((t: any) => {
      const defaultPhases = t.phases
        ? t.phases
        : (t.format === 'grupos'
            ? ['group_stage', 'quarterfinals', 'semifinals', 'final']
            : ['round_robin']);
      return {
        ...t,
        phases: defaultPhases,
        origin: 'created',
      };
    });

    setTournaments(withPhases);
    setIsLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      active: 'status-badge active',
      upcoming: 'status-badge upcoming',
      completed: 'status-badge completed',
    };

    const statusText = {
      active: 'Activo',
      upcoming: 'Próximo',
      completed: 'Finalizado',
    };

    return (
      <span className={badgeClasses[status as keyof typeof badgeClasses]}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  // Estado de partidos por fase
  const [scheduledMatches, setScheduledMatches] = useState<Record<string, Match[]>>({});
  // Estado de edición por partido (inputs controlados)
  const [editState, setEditState] = useState<Record<string, { homeScore: number; awayScore: number; goals?: string; fouls?: string }>>({});

  // Helper para adjuntar el token de admin a llamadas protegidas
  const authHeaders = (): HeadersInit => {
    try {
      const token = localStorage.getItem('access_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // Cargar torneos EXCLUSIVAMENTE desde BD
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments', { cache: 'no-store', headers: { ...authHeaders() } });
        if (!res.ok) throw new Error('No se pudieron cargar los torneos');
        const data = await res.json();
        const withPhases = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          description: '',
          sport: 'futbol',
          category: t.category,
          startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : '',
          endDate: '',
          registrationDeadline: t.registration_deadline ? new Date(t.registration_deadline).toISOString().slice(0, 10) : '',
          maxTeams: t.max_teams ?? 16,
          location: '',
          format: 'round_robin',
          prizePool: '',
          status: t.status,
          phases: ['round_robin'],
          logo: t.logo || '/images/logo.png',
          origin: 'created',
          modality: 'futsal',
        }));
        setTournaments(withPhases);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setTournaments([]);
        setIsLoading(false);
      }
    };
    loadTournaments();
  }, []);

    if (!selectedTournament) {
      setScheduledMatches({});
      setEditState({});
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/tournaments/${selectedTournament.id}/matches`, {
          cache: 'no-store',
          headers: { ...authHeaders() }
        });
        if (!res.ok) throw new Error('No se pudieron cargar los partidos');
        const list = await res.json();

        const byPhase: Record<string, Match[]> = {};
        const nextEdit: Record<string, { homeScore: number; awayScore: number; goals?: string; fouls?: string }> = {};

        for (const m of list) {
          const phaseKey = m.phase || 'Sin Fase';
          byPhase[phaseKey] = byPhase[phaseKey] || [];
          const matchItem: Match = {
            id: String(m.id),
            phase: m.phase,
            homeTeam: m.homeTeam ? { id: String(m.homeTeam.id), name: m.homeTeam.name, logo: m.homeTeam.logo } : null,
            awayTeam: m.awayTeam ? { id: String(m.awayTeam.id), name: m.awayTeam.name, logo: m.awayTeam.logo } : null,
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
            time: m.time ?? undefined,
            venue: m.venue ?? undefined,
            round: m.round ?? undefined,
            group: m.group ?? undefined,
            homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
            awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
            status: m.status,
            goals: m.goals ?? undefined,
            fouls: m.fouls ?? undefined,
          };
          byPhase[phaseKey].push(matchItem);

          nextEdit[String(m.id)] = {
            homeScore: typeof m.homeScore === 'number' ? m.homeScore : 0,
            awayScore: typeof m.awayScore === 'number' ? m.awayScore : 0,
            goals: m.goals ?? '',
            fouls: m.fouls ?? '',
          };
        }

        setScheduledMatches(byPhase);
        setEditState(nextEdit);
      } catch (e) {
        console.error(e);
        setScheduledMatches({});
        setEditState({});
      }
    })();
  }, [selectedTournament]);

  const saveResult = async (phase: string, matchId: string) => {
    const edit = editState[matchId] || { homeScore: 0, awayScore: 0, goals: '', fouls: '' };

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          homeScore: Number(edit.homeScore),
          awayScore: Number(edit.awayScore),
          status: 'finished',
          goals: edit.goals,
          fouls: edit.fouls,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar resultado');

      setScheduledMatches(prev => {
        const phaseMatches = prev[phase] || [];
        const newPhase: Match[] = phaseMatches.map(m =>
          m.id === matchId
            ? {
                ...m,
                homeScore: Number(edit.homeScore),
                awayScore: Number(edit.awayScore),
                status: 'finished',
                goals: edit.goals,
                fouls: edit.fouls,
              }
            : m
        );
        return { ...prev, [phase]: newPhase };
      });

      toast.success('Resultado actualizado');
    } catch {
      toast.error('No se pudo guardar el resultado');
    }
  };

  const deleteMatch = async (phase: string, matchId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Error al eliminar partido');

      setScheduledMatches(prev => {
        const phaseMatches = (prev[phase] || []).filter(m => m.id !== matchId);
        return { ...prev, [phase]: phaseMatches };
      });
      setEditState(prev => {
        const { [matchId]: _, ...rest } = prev;
        return rest;
      });

      toast.success('Partido eliminado');
    } catch {
      toast.error('No se pudo eliminar el partido');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando torneos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">📝 Actualización de Información</h2>
        <p className="content-subtitle">Actualiza resultados de partidos creados por torneo</p>
      </div>

      <div className="update-container">
        {!selectedTournament ? (
          <div className="tournaments-list">
            <h3>Selecciona un torneo para actualizar:</h3>
            {tournaments.map(tournament => (
              <div key={tournament.id} className="tournament-card">
                <div className="tournament-header">
                  <h4>{tournament.name}</h4>
                  {getStatusBadge(tournament.status)}
                </div>
                <div className="tournament-info">
                  <p>
                    <strong>Modalidad:</strong>{' '}
                    {tournament.modality ? (tournament.modality === 'futsal' ? 'Fútbol de Salón' : 'Fútbol 7') : '-'}
                  </p>
                  <p>
                    <strong>Género:</strong> {tournament.category}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {tournament.startDate} - {tournament.endDate}
                  </p>
                </div>
                <button className="btn-primary" onClick={() => setSelectedTournament({ ...tournament })}>
                  Editar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="tournament-form-container">
            <div
              className="form-header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <h3 style={{ marginBottom: 0, marginRight: '1rem' }}>
                  Resultados: {selectedTournament.name}
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge">
                    {selectedTournament.modality === 'futsal' ? 'Fútbol de Salón' : selectedTournament.modality === 'futbol7' ? 'Fútbol 7' : '-'}
                  </span>
                  <span className="badge">{selectedTournament.category === 'masculino' ? 'Masculino' : 'Femenino'}</span>
                </div>
              </div>
              <button className="btn-secondary" onClick={() => setSelectedTournament(null)}>
                ← Volver a la lista
              </button>
            </div>

            {Object.keys(scheduledMatches).length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginTop: '1rem',
                }}
              >
                <p>No hay partidos programados para este torneo.</p>
                <p>Primero programa partidos en “Programación de Partidos”.</p>
              </div>
            ) : (
              <div className="matches-by-phase">
                {Object.entries(scheduledMatches).map(([phase, phaseMatches]) => (
                  <div key={phase} style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Fase: {phase}</h4>

                    {phaseMatches.length === 0 ? (
                      <div
                        className="no-matches"
                        style={{
                          textAlign: 'center',
                          padding: '1rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                        }}
                      >
                        <p>No hay partidos en esta fase.</p>
                      </div>
                    ) : (
                      <div className="matches-grid">
                        {phaseMatches.map(m => (
                          <div key={m.id} className={`match-card ${m.status}`} style={{ marginBottom: '1rem' }}>
                            <div className="match-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{m.group || (m.round ? `Ronda ${m.round}` : '')}</span>
                              <span className={`status-indicator ${m.status === 'finished' ? 'complete' : 'incomplete'}`}>
                                {m.status === 'finished' ? '✔ Finalizado' : '✔ Programado'}
                              </span>
                            </div>

                            <div className="match-teams" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div className="team-slot home">
                                <span>{m.homeTeam?.name || 'Local'}</span>
                              </div>
                              <span className="vs-separator">VS</span>
                              <div className="team-slot away">
                                <span>{m.awayTeam?.name || 'Visitante'}</span>
                              </div>
                            </div>

                            <div
                              className="match-details"
                              style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}
                            >
                              <span>Cancha: {m.venue || '-'}</span>
                              <span>Fecha: {m.date || '-'}</span>
                              <span>Hora: {m.time || '-'}</span>
                            </div>

                            <button className="btn-secondary" onClick={() => deleteMatch(phase, m.id)}>
                              Eliminar
                            </button>

                            {m.status !== 'finished' ? (
                              <div className="match-edit" style={{ marginTop: '0.75rem' }}>
                                <div className="form-grid">
                                  <div className="form-group">
                                    <label>Goles Local</label>
                                    <input
                                      type="number"
                                      value={editState[m.id]?.homeScore ?? 0}
                                      onChange={e =>
                                        setEditState(prev => ({
                                          ...prev,
                                          [m.id]: {
                                            ...(prev[m.id] || { homeScore: 0, awayScore: 0 }),
                                            homeScore: Number(e.target.value),
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Goles Visitante</label>
                                    <input
                                      type="number"
                                      value={editState[m.id]?.awayScore ?? 0}
                                      onChange={e =>
                                        setEditState(prev => ({
                                          ...prev,
                                          [m.id]: {
                                            ...(prev[m.id] || { homeScore: 0, awayScore: 0 }),
                                            awayScore: Number(e.target.value),
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="form-group full-width">
                                    <label>Goles (detalle)</label>
                                    <textarea
                                      rows={2}
                                      value={editState[m.id]?.goals ?? ''}
                                      onChange={e =>
                                        setEditState(prev => ({
                                          ...prev,
                                          [m.id]: {
                                            ...(prev[m.id] || { homeScore: 0, awayScore: 0 }),
                                            goals: e.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="form-group full-width">
                                    <label>Faltas (detalle)</label>
                                    <textarea
                                      rows={2}
                                      value={editState[m.id]?.fouls ?? ''}
                                      onChange={e =>
                                        setEditState(prev => ({
                                          ...prev,
                                          [m.id]: {
                                            ...(prev[m.id] || { homeScore: 0, awayScore: 0 }),
                                            fouls: e.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                                    <button className="btn-primary" onClick={() => saveResult(phase, m.id)}>
                                      Guardar Resultado
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="match-result-display" style={{ marginTop: '0.75rem' }}>
                                <strong>Resultado:</strong> {m.homeScore} - {m.awayScore}
                                {!!m.goals && (
                                  <div>
                                    <strong>Goles:</strong>
                                    <pre style={{ whiteSpace: 'pre-wrap' }}>{m.goals}</pre>
                                  </div>
                                )}
                                {!!m.fouls && (
                                  <div>
                                    <strong>Faltas:</strong>
                                    <pre style={{ whiteSpace: 'pre-wrap' }}>{m.fouls}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}