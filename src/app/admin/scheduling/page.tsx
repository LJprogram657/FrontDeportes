'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Tipos básicos según las rutas detectadas
// Nota: PhaseType se define como string para aceptar valores que vengan del backend o del UI sin errores TS.
type PhaseType = string;

interface TeamBasic {
  id: number;
  name: string;
  logo?: string | null;
}

interface Match {
  id: number;
  phase?: string | null;
  homeTeam: TeamBasic | null;
  awayTeam: TeamBasic | null;
  venue?: string | null;
  date?: string | null;
  time?: string | null;
  round?: number | null;
  group?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  goals?: string | null; // JSON string desde API
  fouls?: string | null; // JSON string desde API
  status: 'scheduled' | 'finished';
}

interface TournamentLite {
  id: number;
  name: string;
  code: string;
  category: 'masculino' | 'femenino';
  logo?: string | null;
  status: string;
  phases?: PhaseType[];
}

function phaseLabel(p: string) {
  switch (p) {
    case 'round_robin':
      return 'Todos contra Todos';
    case 'group_stage':
      return 'Fase de Grupos';
    case 'round_of_16':
      return 'Octavos';
    case 'quarterfinals':
      return 'Cuartos';
    case 'semifinals':
      return 'Semifinal';
    case 'final':
      return 'Final';
    default:
      return p;
  }
}

type TeamState = 'played' | 'scheduled' | 'pending';

function TeamStateChip({ state }: { state: TeamState }) {
  const map = {
    played: { text: 'Jugado', color: 'bg-green-600' },
    scheduled: { text: 'Programado', color: 'bg-yellow-600' },
    pending: { text: 'Pendiente', color: 'bg-gray-600' },
  } as const;
  const info = map[state];
  return (
    <span className={`text-xs ${info.color} text-white px-2 py-0.5 rounded-sm`}>
      {info.text}
    </span>
  );
}

function TeamCard({
  team,
  status,
  onClick,
  draggable,
}: {
  team: TeamBasic;
  status?: TeamState;
  onClick?: () => void;
  draggable?: boolean;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(team));
  };
  return (
    <div
      className={`flex items-center gap-3 p-2 border rounded-md bg-white hover:bg-gray-50 cursor-pointer shadow-sm`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
    >
      <img
        src={team.logo ?? '/images/logo-placeholder.png'}
        alt={team.name}
        className="w-8 h-8 rounded-full object-cover border"
      />
      <div className="flex-1">
        <div className="font-medium text-sm">{team.name}</div>
        {status && (
          <div className="mt-1">
            <TeamStateChip state={status} />
          </div>
        )}
      </div>
    </div>
  );
}

function DropZone({
  label,
  onDropTeam,
  selectedTeam,
  onClear,
}: {
  label: string;
  onDropTeam: (team: TeamBasic) => void;
  selectedTeam: TeamBasic | null;
  onClear: () => void;
}) {
  const [isOver, setIsOver] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };
  const onDragLeave = () => setIsOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const data = e.dataTransfer.getData('text/plain');
      const team: TeamBasic = JSON.parse(data);
      onDropTeam(team);
    } catch {
      // Ignorar
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center border rounded-md h-36 bg-white ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      {selectedTeam ? (
        <div className="flex items-center gap-3">
          <img
            src={selectedTeam.logo ?? '/images/logo-placeholder.png'}
            alt={selectedTeam.name}
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div className="font-medium">{selectedTeam.name}</div>
          <button
            className="ml-3 text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={onClear}
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-400">Arrastra un equipo aquí</div>
      )}
    </div>
  );
}

export default function SchedulingPage() {
  // Torneo y fase
  const [tournaments, setTournaments] = useState<TournamentLite[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [phases, setPhases] = useState<PhaseType[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<PhaseType | null>(null);

  // Equipos y partidos
  const [teams, setTeams] = useState<TeamBasic[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Selección actual
  const [homeTeam, setHomeTeam] = useState<TeamBasic | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamBasic | null>(null);

  // Datos del partido a programar
  const [venue, setVenue] = useState<string>('');
  const [date, setDate] = useState<string>(''); // YYYY-MM-DD
  const [time, setTime] = useState<string>(''); // HH:mm
  const [round, setRound] = useState<number | ''>('');
  const [group, setGroup] = useState<string>('');

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');
  const messageTimerRef = useRef<number | null>(null);

  const clearMessageSoon = useCallback(() => {
    if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
    messageTimerRef.current = window.setTimeout(() => setMessage(''), 4000);
  }, []);

  // Utilidad: mostrar mensaje breve
  const notify = useCallback((msg: string) => {
    setMessage(msg);
    clearMessageSoon();
  }, [clearMessageSoon]);

  // Carga de torneos
  const loadTournaments = useCallback(async () => {
    try {
      const res = await fetch('/api/tournaments', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error cargando torneos (${res.status})`);
      const data: any[] = await res.json();
      const list: TournamentLite[] = data.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        category: d.category,
        logo: d.logo,
        status: d.status,
        phases: (d.phases ?? []) as PhaseType[],
      }));
      setTournaments(list);

      // Seleccionar por defecto el primero activo si no hay selección
      if (!selectedTournamentId && list.length > 0) {
        setSelectedTournamentId(list[0].id);
        const pf = list[0].phases ?? [];
        setPhases(pf.length ? pf : ['round_robin']);
        setSelectedPhase((pf.length ? pf : ['round_robin'])[0]);
      }
    } catch (err: any) {
      notify(`No se pudieron cargar torneos: ${err?.message ?? String(err)}`);
    }
  }, [notify, selectedTournamentId]);

  // Carga de equipos aprobados del torneo
  const loadTeams = useCallback(async (tournamentId: number) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error cargando equipos (${res.status})`);
      const data: any[] = await res.json();
      const list: TeamBasic[] = data.map(d => ({
        id: d.id,
        name: d.name,
        logo: d.logo,
      }));
      setTeams(list);
    } catch (err: any) {
      notify(`No se pudieron cargar equipos: ${err?.message ?? String(err)}`);
    }
  }, [notify]);

  // Carga de partidos existentes desde DB
  const loadExistingMatches = useCallback(async (tournamentId: number, phase: PhaseType | null) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error cargando partidos (${res.status})`);
      const data: any[] = await res.json();
      const list: Match[] = data
        .filter(m => (phase ? m.phase === phase : true))
        .map(m => ({
          id: m.id,
          phase: m.phase ?? null,
          homeTeam: m.homeTeam ?? null,
          awayTeam: m.awayTeam ?? null,
          venue: m.venue ?? null,
          date: m.date ? String(m.date).slice(0, 10) : null, // normalizar YYYY-MM-DD
          time: m.time ?? null,
          round: m.round ?? null,
          group: m.group ?? null,
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
          goals: m.goals ?? null,
          fouls: m.fouls ?? null,
          status: (m.status ?? 'scheduled') as 'scheduled' | 'finished',
        }));
      setMatches(list);
    } catch (err: any) {
      notify(`No se pudieron cargar partidos: ${err?.message ?? String(err)}`);
    }
  }, [notify]);

  // Efecto inicial: torneos
  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  // Cuando cambia torneo → cargar equipos y partidos
  useEffect(() => {
    if (!selectedTournamentId) return;
    const t = tournaments.find(tt => tt.id === selectedTournamentId);
    const pf = t?.phases ?? [];
    setPhases(pf.length ? pf : ['round_robin']);
    setSelectedPhase((pf.length ? pf : ['round_robin'])[0]);

    loadTeams(selectedTournamentId);
    loadExistingMatches(selectedTournamentId, (pf.length ? pf : ['round_robin'])[0]);
  }, [selectedTournamentId, tournaments, loadTeams, loadExistingMatches]);

  // Cuando cambia la fase seleccionada → refrescar partidos
  useEffect(() => {
    if (!selectedTournamentId) return;
    loadExistingMatches(selectedTournamentId, selectedPhase);
  }, [selectedTournamentId, selectedPhase, loadExistingMatches]);

  // Refresco al volver a la pestaña
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && selectedTournamentId) {
        loadTeams(selectedTournamentId);
        loadExistingMatches(selectedTournamentId, selectedPhase);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [selectedTournamentId, selectedPhase, loadTeams, loadExistingMatches]);

  // Selección de equipos
  const handleSelectTeam = useCallback((side: 'home' | 'away', team: TeamBasic) => {
    if (side === 'home') {
      setHomeTeam(team);
      // Si el away coincide con home, quitar away
      if (awayTeam && awayTeam.id === team.id) setAwayTeam(null);
    } else {
      setAwayTeam(team);
      if (homeTeam && homeTeam.id === team.id) setHomeTeam(null);
    }
  }, [homeTeam, awayTeam]);

  const clearHome = () => setHomeTeam(null);
  const clearAway = () => setAwayTeam(null);

  // Mapeo de estado de rivales respecto al equipo local seleccionado
  const opponentStatuses = useMemo(() => {
    if (!homeTeam) return new Map<number, TeamState>();
    const map = new Map<number, TeamState>();
    teams.forEach(op => {
      if (op.id === homeTeam.id) return;
      const found = matches.find(m => {
        const hId = m.homeTeam?.id ?? null;
        const aId = m.awayTeam?.id ?? null;
        const phaseMatch = selectedPhase ? m.phase === selectedPhase : true;
        return phaseMatch && (
          (hId === homeTeam.id && aId === op.id) ||
          (hId === op.id && aId === homeTeam.id)
        );
      });
      if (!found) {
        map.set(op.id, 'pending');
      } else {
        map.set(op.id, found.status === 'finished' ? 'played' : 'scheduled');
      }
    });
    return map;
  }, [homeTeam, teams, matches, selectedPhase]);

  const getTeamStatus = useCallback((opponent: TeamBasic): TeamState => {
    if (!homeTeam) return 'pending';
    const st = opponentStatuses.get(opponent.id);
    return st ?? 'pending';
  }, [homeTeam, opponentStatuses]);

  // Guardar partido (POST si no existe, PATCH si ya existe bajo esta fase)
  const saveMatchToDB = useCallback(async () => {
    if (!selectedTournamentId) return notify('Selecciona un torneo');
    if (!selectedPhase) return notify('Selecciona una fase');
    if (!homeTeam || !awayTeam) return notify('Selecciona ambos equipos');

    setBusy(true);
    try {
      // Buscar si ya existe un partido entre estos equipos en la fase actual
      const existing = matches.find(m => {
        const hId = m.homeTeam?.id ?? null;
        const aId = m.awayTeam?.id ?? null;
        const phaseMatch = selectedPhase ? m.phase === selectedPhase : true;
        return phaseMatch && (
          (hId === homeTeam.id && aId === awayTeam.id) ||
          (hId === awayTeam.id && aId === homeTeam.id)
        );
      });

      if (existing) {
        // PATCH al partido existente
        const res = await fetch(`/api/matches/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'scheduled',
            venue: venue || null,
            date: date || null,
            time: time || null,
            round: round === '' ? null : Number(round),
            group: group || null,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
          }),
        });
        if (!res.ok) throw new Error(`Error actualizando partido (${res.status})`);
        notify('Partido actualizado');
      } else {
        // POST nuevo partido en el torneo/fase actual
        const res = await fetch(`/api/tournaments/${selectedTournamentId}/matches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: selectedPhase,
            venue: venue || null,
            date: date || null,
            time: time || null,
            round: round === '' ? null : Number(round),
            group: group || null,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
          }),
        });
        if (!res.ok) throw new Error(`Error creando partido (${res.status})`);
        notify('Partido creado');
      }

      // Refrescar partidos para reflejar estado de rivales
      await loadExistingMatches(selectedTournamentId, selectedPhase);
    } catch (err: any) {
      notify(`No se pudo guardar: ${err?.message ?? String(err)}`);
    } finally {
      setBusy(false);
    }
  }, [selectedTournamentId, selectedPhase, homeTeam, awayTeam, venue, date, time, round, group, matches, notify, loadExistingMatches]);

  const deleteExistingMatch = useCallback(async () => {
    if (!selectedTournamentId) return notify('Selecciona un torneo');
    if (!selectedPhase) return notify('Selecciona una fase');
    if (!homeTeam || !awayTeam) return notify('Selecciona ambos equipos');

    const existing = matches.find(m => {
      const hId = m.homeTeam?.id ?? null;
      const aId = m.awayTeam?.id ?? null;
      const phaseMatch = selectedPhase ? m.phase === selectedPhase : true;
      return phaseMatch && (
        (hId === homeTeam.id && aId === awayTeam.id) ||
        (hId === awayTeam.id && aId === homeTeam.id)
      );
    });

    if (!existing) return notify('No existe partido entre estos equipos en esta fase');

    setBusy(true);
    try {
      const res = await fetch(`/api/matches/${existing.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Error eliminando partido (${res.status})`);
      notify('Partido eliminado');
      await loadExistingMatches(selectedTournamentId, selectedPhase);
    } catch (err: any) {
      notify(`No se pudo eliminar: ${err?.message ?? String(err)}`);
    } finally {
      setBusy(false);
    }
  }, [selectedTournamentId, selectedPhase, homeTeam, awayTeam, matches, notify, loadExistingMatches]);

  // UI
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Programación de Partidos</h1>
        <button
          className="text-sm px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
          onClick={() => {
            if (selectedTournamentId) {
              loadTeams(selectedTournamentId);
              loadExistingMatches(selectedTournamentId, selectedPhase);
              notify('Datos refrescados');
            }
          }}
        >
          Refrescar
        </button>
      </div>

      {/* Selección de Torneo */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-700">Torneo</label>
          <select
            className="mt-1 w-full border rounded-md p-2"
            value={selectedTournamentId ?? ''}
            onChange={e => setSelectedTournamentId(Number(e.target.value))}
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-700">Fase</label>
          <select
            className="mt-1 w-full border rounded-md p-2"
            value={selectedPhase ?? ''}
            onChange={e => setSelectedPhase(e.target.value)}
          >
            {(phases.length ? phases : (['round_robin'] as PhaseType[])).map(p => (
              <option key={p} value={p}>
                {phaseLabel(p)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          {message ? (
            <div className="w-full text-sm px-3 py-2 rounded bg-blue-50 border border-blue-200 text-blue-700">
              {message}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de equipos con estado relativo al equipo local */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Equipos disponibles</h2>
            <div className="text-xs text-gray-500">
              Arrastra o haz click para seleccionar
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {teams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                status={getTeamStatus(team)}
                onClick={() => {
                  if (!homeTeam) handleSelectTeam('home', team);
                  else if (!awayTeam && team.id !== homeTeam.id) handleSelectTeam('away', team);
                }}
                draggable
              />
            ))}
          </div>
          <div className="mt-4">
            <button
              className="text-sm px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => {
                setHomeTeam(null);
                setAwayTeam(null);
              }}
            >
              Limpiar selección
            </button>
          </div>
        </div>

        {/* Zona de programación */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Partido a programar</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <DropZone
              label="Equipo local"
              selectedTeam={homeTeam}
              onDropTeam={team => handleSelectTeam('home', team)}
              onClear={clearHome}
            />
            <DropZone
              label="Equipo visitante"
              selectedTeam={awayTeam}
              onDropTeam={team => handleSelectTeam('away', team)}
              onClear={clearAway}
            />
          </div>

          {/* Datos del partido */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700">Cancha / Sede</label>
              <input
                className="mt-1 w-full border rounded-md p-2"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="Ej: Cancha 1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Fecha</label>
              <input
                type="date"
                className="mt-1 w-full border rounded-md p-2"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Hora</label>
              <input
                type="time"
                className="mt-1 w-full border rounded-md p-2"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Ronda</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full border rounded-md p-2"
                value={round}
                onChange={e => setRound(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Grupo</label>
              <input
                className="mt-1 w-full border rounded-md p-2"
                value={group}
                onChange={e => setGroup(e.target.value)}
                placeholder="Ej: A / B"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              disabled={busy || !homeTeam || !awayTeam || !selectedPhase || !selectedTournamentId}
              className={`px-4 py-2 rounded text-white ${
                busy ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
              }`}
              onClick={saveMatchToDB}
            >
              {busy ? 'Guardando...' : 'Guardar Partido'}
            </button>
            <button
              disabled={busy || !homeTeam || !awayTeam}
              className={`px-4 py-2 rounded border ${
                busy ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={deleteExistingMatch}
            >
              Eliminar
            </button>
          </div>

          {/* Resumen de partidos de la fase */}
          <div className="mt-8">
            <h3 className="text-md font-semibold">
              Partidos programados en {selectedPhase ? phaseLabel(selectedPhase) : 'fase actual'}
            </h3>
            <div className="mt-3 space-y-2">
              {matches.length === 0 ? (
                <div className="text-sm text-gray-500">No hay partidos en esta fase aún.</div>
              ) : (
                matches.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between border rounded-md p-2 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <TeamCard team={m.homeTeam!} draggable={false} />
                      <span className="text-gray-400">vs</span>
                      <TeamCard team={m.awayTeam!} draggable={false} />
                      <span className="ml-3">
                        <TeamStateChip state={m.status === 'finished' ? 'played' : 'scheduled'} />
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {m.date ? `${m.date}` : 'Sin fecha'}
                      {m.time ? ` • ${m.time}` : ''}
                      {m.venue ? ` • ${m.venue}` : ''}
                      {m.round ? ` • Ronda ${m.round}` : ''}
                      {m.group ? ` • Grupo ${m.group}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}