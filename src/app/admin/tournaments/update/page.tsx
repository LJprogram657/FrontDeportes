'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import apiService from '@/services/api';

// Paleta y estilos UI utilizados en tarjetas y controles
const ui = {
  color: {
    bg: '#0b0f19',
    surface: '#121826',
    surfaceAlt: '#0f172a',
    border: '#1f2937',
    text: '#e5e7eb',
    muted: '#9ca3af',
    brand: '#ef4444',
    brandAlt: '#f59e0b',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    chip: '#1f2937',
  },
  radius: '12px',
  shadow: '0 8px 16px rgba(0,0,0,0.12)',
};

// Tipos fuera del componente
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

// Utilidad para parsear JSON seguro
function parseJSONSafe<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const data = JSON.parse(raw);
    return data as T;
  } catch {
    return fallback;
  }
}

// Item con iconos para listas de eventos (goles/faltas)
function formatEventItem(
  item: { playerId?: number; name?: string; goals?: number; fouls?: number; yellow?: boolean; red?: boolean },
  type: 'goal' | 'foul'
) {
  const icon = type === 'goal' ? '⚽' : '🚫';
  const yellowBadge = item.yellow ? '🟨' : '';
  const redBadge = item.red ? '🟥' : '';
  const qty = type === 'goal' ? (item.goals ?? 0) : (item.fouls ?? 0);

  return (
    <span
      key={`${type}-${item.playerId ?? item.name}-${qty}-${yellowBadge}-${redBadge}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.6rem',
        margin: '0.25rem',
        borderRadius: '999px',
        background: ui.color.chip,
        color: ui.color.text,
        fontSize: '0.9rem',
      }}
      title={`${type === 'goal' ? 'Goles' : 'Faltas'}: ${qty}`}
    >
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span>{item.name || 'Jugador'}</span>
      <span style={{ fontWeight: 700 }}>{qty}</span>
      {yellowBadge && <span>{yellowBadge}</span>}
      {redBadge && <span>{redBadge}</span>}
    </span>
  );
}

// Bloque reutilizable para mostrar eventos por lado
function RenderEventBlock(props: {
  label: 'Goles' | 'Faltas';
  data: { home?: any[]; away?: any[] };
  homeName: string;
  awayName: string;
}) {
  const { label, data, homeName, awayName } = props;
  const type = label === 'Goles' ? 'goal' : 'foul';

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: ui.color.text }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div
          style={{
            background: ui.color.surfaceAlt,
            border: `1px solid ${ui.color.border}`,
            borderRadius: ui.radius,
            padding: '0.6rem',
          }}
        >
          <div style={{ color: ui.color.muted, marginBottom: '0.4rem' }}>{homeName}</div>
          <div>
            {(data.home || []).map((item, idx) => (
              <div key={`home-${label}-${idx}`}>{formatEventItem(item, type)}</div>
            ))}
            {(!data.home || data.home.length === 0) && <span style={{ color: ui.color.muted }}>Sin datos</span>}
          </div>
        </div>
        <div
          style={{
            background: ui.color.surfaceAlt,
            border: `1px solid ${ui.color.border}`,
            borderRadius: ui.radius,
            padding: '0.6rem',
          }}
        >
          <div style={{ color: ui.color.muted, marginBottom: '0.4rem' }}>{awayName}</div>
          <div>
            {(data.away || []).map((item, idx) => (
              <div key={`away-${label}-${idx}`}>{formatEventItem(item, type)}</div>
            ))}
            {(!data.away || data.away.length === 0) && <span style={{ color: ui.color.muted }}>Sin datos</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTournamentUpdatePage() {
  // Selección de torneo
  const [selectedTournament, setSelectedTournament] = useState<{ id: number; name: string } | null>(null);

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
  const [teamsById, setTeamsById] = useState<Record<number, { id: number; name: string; players: Player[] }>>({});

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
  const [scheduledMatches, setScheduledMatches] = useState<Record<string, Match[]>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);
  // Estado para mostrar actividad al avanzar fases por torneo
  const [advancing, setAdvancing] = useState<Record<number, boolean>>({});

  // Orden y mapeo de fases de eliminación directa
  const ELIM_PHASE_ORDER = ['round_of_16', 'quarterfinals', 'semifinals', 'final'] as const;
  const NEXT_BY_PHASE: Record<string, string> = {
    round_of_16: 'quarterfinals',
    quarterfinals: 'semifinals',
    semifinals: 'final',
  };

  // Determina el ganador de un partido finalizado
  const getMatchWinner = (m: Match): { teamId: number; name: string } | null => {
    if (m.status !== 'finished') return null;
    if (typeof m.homeScore !== 'number' || typeof m.awayScore !== 'number') return null;
    if (!m.homeTeam?.id || !m.awayTeam?.id) return null;
    if (m.homeScore === m.awayScore) return null; // empates requieren resolución manual
    return m.homeScore > m.awayScore
      ? { teamId: Number(m.homeTeam.id), name: m.homeTeam.name }
      : { teamId: Number(m.awayTeam.id), name: m.awayTeam.name };
  };

  // Avanza el torneo a la siguiente fase creando cruces automáticamente
  const advanceToNextPhase = async (tournamentId: number) => {
    // Evitar doble clic
    setAdvancing((prev) => ({ ...prev, [tournamentId]: true }));
    try {
      const token = apiService.getAccessToken();
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se pudieron cargar los partidos');
      const matches: any[] = await res.json();

      // Agrupar por fase
      const byPhase: Record<string, Match[]> = {};
      (matches || []).forEach((m: any) => {
        const phase = m.phase || 'General';
        const mapped: Match = {
          id: String(m.id),
          homeTeam: m.homeTeam ? { id: Number(m.homeTeam.id), name: m.homeTeam.name } : undefined,
          awayTeam: m.awayTeam ? { id: Number(m.awayTeam.id), name: m.awayTeam.name } : undefined,
          homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
          awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
          status: m.status === 'finished' ? 'finished' : 'scheduled',
        };
        if (!byPhase[phase]) byPhase[phase] = [];
        byPhase[phase].push(mapped);
      });

      // Encontrar la fase actual de eliminación para avanzar
      const currentPhase = ELIM_PHASE_ORDER.find((p) => (byPhase[p] || []).length > 0) || null;
      if (!currentPhase) {
        toast.error('No hay una fase de eliminación para avanzar');
        return;
      }

      const nextPhase = NEXT_BY_PHASE[currentPhase];
      if (!nextPhase) {
        toast.error('La fase actual es la final o no tiene siguiente');
        return;
      }

      // Evitar duplicados si ya hay partidos en la siguiente fase
      if ((byPhase[nextPhase] || []).length > 0) {
        toast.warning('Ya existen partidos en la siguiente fase');
        return;
      }

      const phaseMatches = byPhase[currentPhase] || [];
      const allFinished = phaseMatches.length > 0 && phaseMatches.every((m) => m.status === 'finished');
      if (!allFinished) {
        toast.error('Aún hay partidos sin finalizar en la fase actual');
        return;
      }

      // Calcular ganadores
      const winners = phaseMatches
        .map(getMatchWinner)
        .filter(Boolean) as Array<{ teamId: number; name: string }>;

      if (winners.length < 2) {
        toast.error('No hay suficientes ganadores para crear cruces');
        return;
      }

      // Crear cruces por pares
      let createdCount = 0;
      for (let i = 0; i < winners.length; i += 2) {
        const a = winners[i];
        const b = winners[i + 1];
        if (!a || !b) continue;
        const createRes = await fetch(`/api/tournaments/${tournamentId}/matches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            phase: nextPhase,
            homeTeamId: a.teamId,
            awayTeamId: b.teamId,
          }),
        });
        if (createRes.ok) createdCount += 1;
      }

      if (createdCount > 0) {
        toast.success(`Se crearon ${createdCount} partido(s) en ${nextPhase}`);
      } else {
        toast.error('No se pudieron crear los partidos de la siguiente fase');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error avanzando de fase');
    } finally {
      setAdvancing((prev) => ({ ...prev, [tournamentId]: false }));
    }
  };

  // Restaurar torneo seleccionado desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_update_selected_tournament');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.id === 'number' && parsed.name) {
          setSelectedTournament({ id: parsed.id, name: parsed.name });
        }
      }
    } catch {
      // ignore
    }
  }, []);

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
          cache: 'no-store',
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

  // Cargar partidos del torneo seleccionado y agrupar por fase (con AbortController y no-store)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      if (!selectedTournament) {
        setScheduledMatches({});
        return;
      }
      setIsLoadingMatches(true);
      try {
        const token = apiService.getAccessToken();
        const res = await fetch(`/api/tournaments/${selectedTournament.id}/matches`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Error al cargar partidos');
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
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
          toast.error('Error cargando partidos');
          setScheduledMatches({});
        }
      } finally {
        setIsLoadingMatches(false);
      }
    })();
    return () => controller.abort();
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
        const res = await fetch(`/api/tournaments/admin/tournaments/${selectedTournament.id}/teams`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          cache: 'no-store',
        });

        const teams: Array<{
          id: number;
          name: string;
          players: Array<{ id: number; name: string; lastName?: string }>;
        }> = await res.json();

        const map: Record<number, { id: number; name: string; players: Player[] }> = {};
        (teams || []).forEach((t) => {
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

  // Deriva eventos por jugador a partir de teamsById SIN setState (para render seguro)
  const deriveEventsForMatch = (m: Match): { home: PlayerEvent[]; away: PlayerEvent[] } => {
    const homePlayers = m.homeTeam?.id ? teamsById[Number(m.homeTeam.id)]?.players || [] : [];
    const awayPlayers = m.awayTeam?.id ? teamsById[Number(m.awayTeam.id)]?.players || [] : [];
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
    return { home, away };
  };

  // Guardar resultado y eventos por jugador
  const saveMatchResult = async (matchId: string, phase: string, m: Match) => {
    const edit = editState[matchId] || {
      homeScore: typeof m.homeScore === 'number' ? m.homeScore : 0,
      awayScore: typeof m.awayScore === 'number' ? m.awayScore : 0,
    };

    const events = edit.events ?? deriveEventsForMatch(m);

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
      const res = await fetch(`/api/matches/${matchId}`, {
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
      if (!res.ok) throw new Error('Error guardando resultado');

      setScheduledMatches((prev) => {
        const phaseMatches = prev[phase] || [];
        const newPhase: Match[] = phaseMatches.map((mm) =>
          mm.id === matchId
            ? {
                ...mm,
                status: 'finished',
                homeScore: edit.homeScore,
                awayScore: edit.awayScore,
                goals: goalsPayload,
                fouls: foulsPayload,
              }
            : mm
        );
        return { ...prev, [phase]: newPhase };
      });

      setEditState((prev) => ({
        ...prev,
        [matchId]: {
          ...edit,
          goals: goalsPayload,
          fouls: foulsPayload,
          events,
        },
      }));

      toast.success('Resultado actualizado');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo guardar el resultado');
    }
  };

  // Actualiza eventos de un jugador en un match (parcial por patch)
  const setPlayerEvent = (matchId: string, m: Match, side: 'home' | 'away', idx: number, patch: Partial<PlayerEvent>) => {
    setEditState((prev) => {
      const existing = prev[matchId];
      const baseEvents = existing?.events ?? deriveEventsForMatch(m);
      const nextSide = baseEvents[side].slice();
      nextSide[idx] = { ...nextSide[idx], ...patch };

      return {
        ...prev,
        [matchId]: {
          homeScore: existing?.homeScore ?? (typeof m.homeScore === 'number' ? m.homeScore : 0),
          awayScore: existing?.awayScore ?? (typeof m.awayScore === 'number' ? m.awayScore : 0),
          events: { ...baseEvents, [side]: nextSide },
        },
      };
    });
  };

  // Suma goles por jugador y los pone en el marcador
  const autoCalcScore = (matchId: string, m: Match) => {
    setEditState((prev) => {
      const existing = prev[matchId];
      const events = existing?.events ?? deriveEventsForMatch(m);
      const homeScore = events.home.reduce((acc, p) => acc + (p.goals || 0), 0);
      const awayScore = events.away.reduce((acc, p) => acc + (p.goals || 0), 0);
      return {
        ...prev,
        [matchId]: {
          ...(existing || {}),
          homeScore,
          awayScore,
          events,
        },
      };
    });
  };

  // UI helpers
  const scoreInput = (label: string, value: number, onChange: (v: number) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color: ui.color.muted }}>{label}</span>
      <button
        onClick={() => onChange(Math.max(0, (value || 0) - 1))}
        style={{ padding: '0.2rem 0.6rem' }}
        title="Menos"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        step={1}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
        style={{
          width: '60px',
          padding: '0.25rem 0.4rem',
          borderRadius: '6px',
          border: `1px solid ${ui.color.border}`,
          background: ui.color.surfaceAlt,
          color: ui.color.text,
        }}
      />
      <button
        onClick={() => onChange((value || 0) + 1)}
        style={{ padding: '0.2rem 0.6rem' }}
        title="Más"
      >
        +
      </button>
    </div>
  );

  return (
    <div style={{ padding: '1rem' }}>
      {/* Vista inicial: cuadrícula de logos de torneos */}
      {!selectedTournament && (
        <div>
          <h3 style={{ color: ui.color.text }}>Selecciona un torneo</h3>
          {isLoadingTournaments ? (
            <p style={{ color: ui.color.muted }}>Cargando torneos...</p>
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
                  onClick={() => {
                    const sel = { id: t.id, name: t.name };
                    setSelectedTournament(sel);
                    try {
                      localStorage.setItem('admin_update_selected_tournament', JSON.stringify(sel));
                    } catch {
                      // ignore
                    }
                  }}
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
                  <div style={{ marginTop: '0.75rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <button
                      title="Siguiente fase"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (advancing[t.id]) return;
                        advanceToNextPhase(t.id);
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: `1px solid ${ui.color.border}`,
                        background: ui.color.brandAlt,
                        color: '#111',
                        fontWeight: 700,
                        cursor: 'pointer',
                        minWidth: '160px',
                      }}
                    >
                      {advancing[t.id] ? 'Procesando…' : 'Siguiente fase'}
                    </button>
                  </div>
                </div>
              ))}
              {tournaments.length === 0 && <p style={{ color: ui.color.muted }}>No hay torneos creados aún.</p>}
            </div>
          )}
        </div>
      )}

      {/* Vista de partidos: se muestra al seleccionar un torneo */}
      {selectedTournament && (
        <div className="matches-by-phase">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              onClick={() => {
                setSelectedTournament(null);
                try {
                  localStorage.removeItem('admin_update_selected_tournament');
                } catch {
                  // ignore
                }
              }}
              style={{ padding: '0.4rem 0.8rem' }}
            >
              ← Volver a torneos
            </button>
            <h3 style={{ margin: 0, color: ui.color.text }}>{selectedTournament.name}</h3>
          </div>

          {isLoadingMatches && <p style={{ color: ui.color.muted }}>Cargando partidos...</p>}
          {!isLoadingMatches && Object.keys(scheduledMatches).length === 0 && (
            <p style={{ color: ui.color.muted }}>No hay partidos programados para este torneo.</p>
          )}

          {Object.entries(scheduledMatches).map(([phase, phaseMatches]) => (
            <div key={phase} style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: ui.color.text }}>Fase: {phase}</h4>

              {/* Programados */}
              <div className="matches-block" style={{ marginBottom: '1.5rem' }}>
                <h6 style={{ color: ui.color.text, marginBottom: '0.5rem' }}>Programados</h6>
                {(phaseMatches || [])
                  .filter((m) => m.status === 'scheduled')
                  .map((m) => {
                    const edit = editState[m.id] || {
                      homeScore: typeof m.homeScore === 'number' ? m.homeScore : 0,
                      awayScore: typeof m.awayScore === 'number' ? m.awayScore : 0,
                    };
                    const events = edit.events ?? deriveEventsForMatch(m);

                    return (
                      <div
                        key={`scheduled-${m.id}`}
                        style={{
                          border: `1px solid ${ui.color.border}`,
                          borderRadius: ui.radius,
                          padding: '0.75rem',
                          background: ui.color.surface,
                          boxShadow: ui.shadow,
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div style={{ color: ui.color.text, textAlign: 'right', fontWeight: 700 }}>
                            {m.homeTeam?.name || 'Local'}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: '0.75rem',
                              justifyContent: 'center',
                              color: ui.color.text,
                            }}
                          >
                            {scoreInput('Local', edit.homeScore, (v) =>
                              setEditState((prev) => ({
                                ...prev,
                                [m.id]: { ...(prev[m.id] || { awayScore: edit.awayScore }), homeScore: v, events: prev[m.id]?.events },
                              }))
                            )}
                            <span style={{ color: ui.color.muted }}>|</span>
                            {scoreInput('Visitante', edit.awayScore, (v) =>
                              setEditState((prev) => ({
                                ...prev,
                                [m.id]: { ...(prev[m.id] || { homeScore: edit.homeScore }), awayScore: v, events: prev[m.id]?.events },
                              }))
                            )}
                          </div>
                          <div style={{ color: ui.color.text, textAlign: 'left', fontWeight: 700 }}>
                            {m.awayTeam?.name || 'Visitante'}
                          </div>
                        </div>

                        {/* Controles "tipo videojuego" de eventos por jugador */}
                        {(m.homeTeam?.id && m.awayTeam?.id) ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {/* Home side */}
                            <div
                              style={{
                                background: ui.color.surfaceAlt,
                                border: `1px solid ${ui.color.border}`,
                                borderRadius: ui.radius,
                                padding: '0.6rem',
                              }}
                            >
                              <div style={{ marginBottom: '0.5rem', color: ui.color.muted }}>{m.homeTeam?.name || 'Local'}</div>
                              <div>
                                {events.home.map((p, idx) => (
                                  <div
                                    key={`home-${m.id}-${p.playerId}-${idx}`}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '1fr auto',
                                      gap: '0.5rem',
                                      alignItems: 'center',
                                      padding: '0.35rem 0.25rem',
                                    }}
                                  >
                                    <div style={{ color: ui.color.text }}>{p.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {/* Goles */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Goles">
                                        <button
                                          onClick={() =>
                                            setPlayerEvent(m.id, m, 'home', idx, { goals: Math.max(0, (p.goals || 0) - 1) })
                                          }
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          ⚽−
                                        </button>
                                        <span style={{ color: ui.color.text, minWidth: '1ch', textAlign: 'center' }}>
                                          {p.goals || 0}
                                        </span>
                                        <button
                                          onClick={() => setPlayerEvent(m.id, m, 'home', idx, { goals: (p.goals || 0) + 1 })}
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          ⚽+
                                        </button>
                                      </div>
                                      {/* Faltas */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Faltas">
                                        <button
                                          onClick={() =>
                                            setPlayerEvent(m.id, m, 'home', idx, { fouls: Math.max(0, (p.fouls || 0) - 1) })
                                          }
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          🚫−
                                        </button>
                                        <span style={{ color: ui.color.text, minWidth: '1ch', textAlign: 'center' }}>
                                          {p.fouls || 0}
                                        </span>
                                        <button
                                          onClick={() => setPlayerEvent(m.id, m, 'home', idx, { fouls: (p.fouls || 0) + 1 })}
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          🚫+
                                        </button>
                                      </div>
                                      {/* Amarilla */}
                                      <button
                                        onClick={() => setPlayerEvent(m.id, m, 'home', idx, { yellow: !p.yellow })}
                                        style={{
                                          padding: '0.2rem 0.5rem',
                                          background: p.yellow ? ui.color.warning : 'transparent',
                                          color: p.yellow ? '#000' : ui.color.text,
                                          borderRadius: '6px',
                                          border: `1px solid ${ui.color.border}`,
                                        }}
                                        title="Tarjeta amarilla"
                                      >
                                        🟨
                                      </button>
                                      {/* Roja */}
                                      <button
                                        onClick={() => setPlayerEvent(m.id, m, 'home', idx, { red: !p.red })}
                                        style={{
                                          padding: '0.2rem 0.5rem',
                                          background: p.red ? ui.color.danger : 'transparent',
                                          color: ui.color.text,
                                          borderRadius: '6px',
                                          border: `1px solid ${ui.color.border}`,
                                        }}
                                        title="Tarjeta roja"
                                      >
                                        🟥
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {events.home.length === 0 && (
                                  <div style={{ color: ui.color.muted }}>Sin jugadores para el equipo local.</div>
                                )}
                              </div>
                            </div>

                            {/* Away side */}
                            <div
                              style={{
                                background: ui.color.surfaceAlt,
                                border: `1px solid ${ui.color.border}`,
                                borderRadius: ui.radius,
                                padding: '0.6rem',
                              }}
                            >
                              <div style={{ marginBottom: '0.5rem', color: ui.color.muted }}>{m.awayTeam?.name || 'Visitante'}</div>
                              <div>
                                {events.away.map((p, idx) => (
                                  <div
                                    key={`away-${m.id}-${p.playerId}-${idx}`}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '1fr auto',
                                      gap: '0.5rem',
                                      alignItems: 'center',
                                      padding: '0.35rem 0.25rem',
                                    }}
                                  >
                                    <div style={{ color: ui.color.text }}>{p.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {/* Goles */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Goles">
                                        <button
                                          onClick={() =>
                                            setPlayerEvent(m.id, m, 'away', idx, { goals: Math.max(0, (p.goals || 0) - 1) })
                                          }
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          ⚽−
                                        </button>
                                        <span style={{ color: ui.color.text, minWidth: '1ch', textAlign: 'center' }}>
                                          {p.goals || 0}
                                        </span>
                                        <button
                                          onClick={() => setPlayerEvent(m.id, m, 'away', idx, { goals: (p.goals || 0) + 1 })}
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          ⚽+
                                        </button>
                                      </div>
                                      {/* Faltas */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Faltas">
                                        <button
                                          onClick={() =>
                                            setPlayerEvent(m.id, m, 'away', idx, { fouls: Math.max(0, (p.fouls || 0) - 1) })
                                          }
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          🚫−
                                        </button>
                                        <span style={{ color: ui.color.text, minWidth: '1ch', textAlign: 'center' }}>
                                          {p.fouls || 0}
                                        </span>
                                        <button
                                          onClick={() => setPlayerEvent(m.id, m, 'away', idx, { fouls: (p.fouls || 0) + 1 })}
                                          style={{ padding: '0.2rem 0.5rem' }}
                                        >
                                          🚫+
                                        </button>
                                      </div>
                                      {/* Amarilla */}
                                      <button
                                        onClick={() => setPlayerEvent(m.id, m, 'away', idx, { yellow: !p.yellow })}
                                        style={{
                                          padding: '0.2rem 0.5rem',
                                          background: p.yellow ? ui.color.warning : 'transparent',
                                          color: p.yellow ? '#000' : ui.color.text,
                                          borderRadius: '6px',
                                          border: `1px solid ${ui.color.border}`,
                                        }}
                                        title="Tarjeta amarilla"
                                      >
                                        🟨
                                      </button>
                                      {/* Roja */}
                                      <button
                                        onClick={() => setPlayerEvent(m.id, m, 'away', idx, { red: !p.red })}
                                        style={{
                                          padding: '0.2rem 0.5rem',
                                          background: p.red ? ui.color.danger : 'transparent',
                                          color: ui.color.text,
                                          borderRadius: '6px',
                                          border: `1px solid ${ui.color.border}`,
                                        }}
                                        title="Tarjeta roja"
                                      >
                                        🟥
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {events.away.length === 0 && (
                                  <div style={{ color: ui.color.muted }}>Sin jugadores para el equipo visitante.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: ui.color.muted, marginTop: '0.5rem' }}>
                            Equipos no asignados completamente para este partido.
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <button
                            onClick={() => autoCalcScore(m.id, m)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px' }}
                            title="Sumar goles y actualizar marcador"
                          >
                            Calcular marcador automático
                          </button>
                          <button
                            onClick={() => saveMatchResult(m.id, phase, m)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: ui.color.success, color: '#000' }}
                            title="Guardar resultado y eventos"
                          >
                            Guardar resultado
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {phaseMatches.filter((m) => m.status === 'scheduled').length === 0 && (
                  <div style={{ color: ui.color.muted }}>No hay partidos programados en esta fase.</div>
                )}
              </div>

              {/* Finalizados */}
              <div className="matches-block">
                <h6 style={{ color: ui.color.text, marginBottom: '0.5rem' }}>Finalizados</h6>
                {(phaseMatches || [])
                  .filter((m) => m.status === 'finished')
                  .map((m) => {
                    const goals = parseJSONSafe<{ home?: any[]; away?: any[] }>(m.goals, { home: [], away: [] });
                    const fouls = parseJSONSafe<{ home?: any[]; away?: any[] }>(m.fouls, { home: [], away: [] });

                    return (
                      <div
                        key={`finished-${m.id}`}
                        style={{
                          border: `1px solid ${ui.color.border}`,
                          borderRadius: ui.radius,
                          padding: '0.75rem',
                          background: ui.color.surface,
                          boxShadow: ui.shadow,
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ color: ui.color.text, textAlign: 'right', fontWeight: 700 }}>
                            {m.homeTeam?.name || 'Local'}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: '0.75rem',
                              justifyContent: 'center',
                              color: ui.color.text,
                              fontWeight: 700,
                            }}
                          >
                            <span>{Number.isFinite(m.homeScore) ? m.homeScore : 0}</span>
                            <span>-</span>
                            <span>{Number.isFinite(m.awayScore) ? m.awayScore : 0}</span>
                          </div>
                          <div style={{ color: ui.color.text, textAlign: 'left', fontWeight: 700 }}>
                            {m.awayTeam?.name || 'Visitante'}
                          </div>
                        </div>

                        <RenderEventBlock
                          label="Goles"
                          data={goals}
                          homeName={m.homeTeam?.name || 'Local'}
                          awayName={m.awayTeam?.name || 'Visitante'}
                        />

                        <RenderEventBlock
                          label="Faltas"
                          data={fouls}
                          homeName={m.homeTeam?.name || 'Local'}
                          awayName={m.awayTeam?.name || 'Visitante'}
                        />
                      </div>
                    );
                  })}
                {phaseMatches.filter((m) => m.status === 'finished').length === 0 && (
                  <div style={{ color: ui.color.muted }}>No hay partidos finalizados en esta fase.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
