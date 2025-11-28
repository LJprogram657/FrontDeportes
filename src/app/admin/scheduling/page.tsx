'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../styles/admin-dashboard.css';
import '../../styles/scheduling.css';
import { toast } from 'sonner';

// Tipos
interface Tournament {
  id: number;
  name: string;
  logo: string;
  format: 'todos_contra_todos' | 'fase_grupos' | 'eliminatorias';
  phases: string[];
  sport: string;
}

interface Team {
  id: string;        // id local "team-<dbId>"
  name: string;
  logo: string;
  dbId: number;      // id real en BD
  source?: 'server' | 'local';
}

interface Match {
  id: string;        // id local "match-<phase>-<n>" o "db-<id>"
  phase: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  date?: string;
  time?: string;
  venue?: string;    // id de cancha (mock) o nombre
  round?: number;
  group?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'finished';
  dbId?: number;     // id real de BD si existe
}

interface Venue {
  id: string;
  name: string;
  address: string;
  images: string[];
  sports: string[];
}

// Canchas de ejemplo (coherentes con tu UI)
const mockVenues: Venue[] = [
  { id: '1', name: 'Cancha Principal', address: 'Por definir', images: ['/images/default-venue.jpg'], sports: ['futbol.salon', 'futbol.7'] },
  { id: '2', name: 'Cancha Auxiliar', address: 'Por definir', images: ['/images/default-venue.jpg'], sports: ['futbol.salon', 'futbol.7'] },
];

// ----------------- Página raíz -----------------
const SchedulingPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga torneos desde BD
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments', { cache: 'no-store' });
        const list = await res.json();
        const formatted: Tournament[] = (Array.isArray(list) ? list : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          logo: t.logo || '/images/logo.png',
          format: 'todos_contra_todos',
          phases: ['Todos contra Todos'],
          sport: 'futbol.salon',
        }));
        setTournaments(formatted);
      } catch (error) {
        console.error('Error cargando torneos:', error);
        setTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTournaments();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando torneos...</p>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div>
        <div className="content-header">
          <h2 className="content-title">📅 Programación de Partidos</h2>
          <p className="content-subtitle">No hay torneos disponibles para programar</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8f9fa', borderRadius: 8, margin: '2rem 0' }}>
          <h3>🏆 No hay torneos creados</h3>
          <p>Primero crea un torneo en “Creación de torneos”.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">📅 Programación de Partidos</h2>
        <p className="content-subtitle">
          {selectedTournament ? `Programando partidos para: ${selectedTournament.name}` : 'Selecciona un torneo para comenzar.'}
        </p>
      </div>

      {!selectedTournament ? (
        <TournamentSelector tournaments={tournaments} onSelect={setSelectedTournament} />
      ) : (
        <SchedulingPanel tournament={selectedTournament} onBack={() => setSelectedTournament(null)} />
      )}
    </div>
  );
};

// ----------------- Selector de torneo -----------------
interface TournamentSelectorProps {
  tournaments: Tournament[];
  onSelect: (tournament: Tournament) => void;
}

const TournamentSelector: React.FC<TournamentSelectorProps> = ({ tournaments, onSelect }) => {
  return (
    <div className="tournament-selector-container">
      {tournaments.map(t => (
        <div key={t.id} className="tournament-select-card" onClick={() => onSelect(t)}>
          <img src={t.logo} alt={`Logo de ${t.name}`} />
          <h4>{t.name}</h4>
        </div>
      ))}
    </div>
  );
};

// ----------------- Tabla de equipos -----------------
interface TeamsTableProps {
  teams: Team[];
  onDragStart: (team: Team) => void;
  onSelectTeam?: (team: Team) => void;
  getTeamStatus?: (teamId: string) => 'played' | 'scheduled' | 'remaining' | 'self' | undefined;
}

const TeamsTable: React.FC<TeamsTableProps> = ({ teams, onDragStart, onSelectTeam, getTeamStatus }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {teams.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d', background: '#fff', borderRadius: 6, border: '1px dashed #e0e0e0' }}>
          No hay equipos registrados para este torneo.
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map(team => {
            const status = getTeamStatus?.(team.id);
            const extraClass =
              status === 'played' ? 'played' :
              status === 'scheduled' ? 'scheduled' :
              status === 'self' ? 'selected' :
              status ? 'remaining' : '';
            return (
              <div
                key={team.id}
                className={`team-item ${extraClass}`}
                draggable
                onDragStart={() => onDragStart(team)}
                onClick={() => onSelectTeam?.(team)}
                title="Clic para seleccionar y ver jugados/pendientes"
              >
                <img src={team.logo} alt={team.name} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="team-name" style={{ fontWeight: 700 }}>{team.name}</span>
                  <span style={{ fontSize: 12, color: '#6c757d' }}>Arrastra a un partido</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ----------------- Panel de programación -----------------
interface SchedulingPanelProps {
  tournament: Tournament;
  onBack: () => void;
}

const SchedulingPanel: React.FC<SchedulingPanelProps> = ({ tournament, onBack }) => {
  const [matches, setMatches] = useState<Match[]>([]);        // partidos locales (forms)
  const [dbMatches, setDbMatches] = useState<Match[]>([]);    // partidos existentes en BD (solo lectura)
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [venues] = useState<Venue[]>(mockVenues);
  const [selectedPhase, setSelectedPhase] = useState<string>(tournament.phases[0]);
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const authHeaders = (): HeadersInit => {
    try {
      const token = localStorage.getItem('access_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const filteredVenues = venues.filter(v => v.sports.includes(tournament.sport));

  // Equipos del torneo
  const loadRegisteredTeams = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, { cache: 'no-store', headers: { ...authHeaders() } });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || 'No se pudieron cargar los equipos');
      }
      const serverTeams = await res.json();
      const unique: Team[] = (Array.isArray(serverTeams) ? serverTeams : []).map((t: any) => ({
        id: `team-${t.id}`,
        dbId: Number(t.id),
        name: t.name,
        logo: t.logo || '/images/logo.png',
        source: 'server',
      }));
      setAvailableTeams(unique);
    } catch (error) {
      console.error('Error cargando equipos:', error);
      toast.error('No se pudieron cargar los equipos del torneo');
      setAvailableTeams([]);
    }
  }, [tournament.id]);

  // Partidos existentes en BD
  const loadExistingMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/matches`, { cache: 'no-store', headers: { ...authHeaders() } });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || 'No se pudieron cargar los partidos');
      }
      const list = await res.json();
      const normalized: Match[] = (Array.isArray(list) ? list : [])
        .filter((m: any) => (m?.phase ?? 'Todos contra Todos') === selectedPhase)
        .map((m: any) => {
          const homeFromApi = m?.homeTeam ?? null;
          const awayFromApi = m?.awayTeam ?? null;

          const homeTeam: Team | null = homeFromApi
            ? { id: `team-${homeFromApi.id}`, dbId: Number(homeFromApi.id), name: homeFromApi.name ?? 'Equipo', logo: homeFromApi.logo ?? '/images/logo.png', source: 'server' }
            : (availableTeams.find(t => t.dbId === Number(m.homeTeamId)) ?? null);

          const awayTeam: Team | null = awayFromApi
            ? { id: `team-${awayFromApi.id}`, dbId: Number(awayFromApi.id), name: awayFromApi.name ?? 'Equipo', logo: awayFromApi.logo ?? '/images/logo.png', source: 'server' }
            : (availableTeams.find(t => t.dbId === Number(m.awayTeamId)) ?? null);

          return {
            id: `db-${m.id}`,
            dbId: Number(m.id),
            phase: m.phase ?? 'Todos contra Todos',
            homeTeam,
            awayTeam,
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
            time: m.time ?? undefined,
            venue: m.venue ?? undefined,
            round: m.round ?? undefined,
            group: m.group ?? undefined,
            homeScore: m.homeScore ?? undefined,
            awayScore: m.awayScore ?? undefined,
            status: (m.status as 'scheduled' | 'finished') ?? 'scheduled',
          } as Match;
        });

      setDbMatches(normalized);
    } catch (error) {
      console.error('Error cargando partidos:', error);
      toast.error('No se pudieron cargar los partidos del torneo');
      setDbMatches([]);
    }
  }, [tournament.id, selectedPhase, availableTeams]);

  // Cargas iniciales y al cambiar fase
  useEffect(() => { loadRegisteredTeams(); }, [loadRegisteredTeams]);
  useEffect(() => { loadExistingMatches(); }, [loadExistingMatches]);

  // Refrescar al volver la pestaña
  useEffect(() => {
    const onVisibility = () => { if (!document.hidden) { loadRegisteredTeams(); loadExistingMatches(); } };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadRegisteredTeams, loadExistingMatches]);

  // Limpiar partidos locales al cambiar fase
  useEffect(() => { setMatches([]); setSelectedTeam(null); }, [selectedPhase]);

  // Añadir partido local (muestra formulario)
  const addMatch = () => {
    const newMatch: Match = {
      id: `match-${selectedPhase}-${matches.length + 1}`,
      phase: selectedPhase,
      homeTeam: null,
      awayTeam: null,
      status: 'scheduled',
    };
    setMatches(prev => [...prev, newMatch]);
  };

  // Drag & drop (solo en formularios locales)
  const handleDragStart = (team: Team) => setDraggedTeam(team);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, matchId: string, position: 'home' | 'away') => {
    e.preventDefault();
    if (!draggedTeam) return;
    setMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        const updated = { ...match };
        if (position === 'home') updated.homeTeam = draggedTeam;
        else updated.awayTeam = draggedTeam;
        return updated;
      }
      return match;
    }));
    setDraggedTeam(null);
  };

  const removeTeamFromMatch = (matchId: string, position: 'home' | 'away') => {
    setMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        const updated = { ...match };
        if (position === 'home') updated.homeTeam = null;
        else updated.awayTeam = null;
        return updated;
      }
      return match;
    }));
  };

  const updateMatchVenue = (matchId: string, venue: string) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, venue } : m));
  };

  const updateMatchDateTime = (matchId: string, date: string, time: string) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, date, time } : m));
  };

  const updateMatchResult = (matchId: string, homeScore: number, awayScore: number) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore, awayScore, status: 'finished' } : m));
  };

  // Guardar partido en BD (POST) con prevención básica de duplicado
  const saveMatchToDB = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    const isComplete = match && match.homeTeam && match.awayTeam && match.venue && match?.date && match?.time;
    if (!isComplete || !match) {
      toast.error('Completa equipos, cancha, fecha y hora antes de guardar');
      return;
    }

    const resolveDbId = (team: Team | null) => {
      if (!team) return null;
      if (team.source === 'server' && Number.isFinite(team.dbId)) return team.dbId;
      const candidate = availableTeams.find(t => t.source === 'server' && t.name === team.name);
      return candidate?.dbId ?? null;
    };
    const homeDbId = resolveDbId(match.homeTeam);
    const awayDbId = resolveDbId(match.awayTeam);

    if (!homeDbId || !awayDbId) {
      toast.error('Los equipos deben existir/estar aprobados en BD.');
      return;
    }

    const existsDuplicate = dbMatches.some(dm =>
      (dm.phase === match.phase) &&
      (dm.homeTeam?.dbId === homeDbId && dm.awayTeam?.dbId === awayDbId)
    );
    if (existsDuplicate) {
      toast.warning('Ese partido ya está programado en BD para esta fase.');
      return;
    }

    try {
      const resp = await fetch(`/api/tournaments/${tournament.id}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          phase: match.phase,
          venue: match.venue ?? null,
          date: match.date ?? null,
          time: match.time ?? null,
          round: match.round ?? null,
          group: match.group ?? null,
          homeTeamId: homeDbId,
          awayTeamId: awayDbId,
        }),
      });
      if (!resp.ok) {
        const msg = await resp.json().catch(() => ({}));
        throw new Error(msg?.error || 'No autorizado o datos inválidos al crear partido');
      }
      const created = await resp.json();
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, dbId: Number(created?.id) } : m));
      toast.success('Partido guardado en la base de datos');
      loadExistingMatches(); // recargar BD
    } catch (e) {
      console.error(e);
      toast.error('No se pudo guardar el partido');
    }
  };

  // Eliminar partido
  const deleteMatch = async (matchId: string) => {
    const localMatch = matches.find(m => m.id === matchId);
    if (localMatch?.dbId) {
      try {
        const res = await fetch(`/api/matches/${localMatch.dbId}`, { method: 'DELETE', headers: { ...authHeaders() } });
        if (!res.ok) throw new Error('Error al eliminar en BD');
        toast.success('Partido eliminado en BD');
        loadExistingMatches();
      } catch (e) {
        console.error(e);
        toast.error('No se pudo eliminar el partido en BD');
      }
    }
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  // Selección de equipo para resaltar oponentes
  const handleSelectTeam = (team: Team) => setSelectedTeam(prev => (prev?.id === team.id ? null : team));

  // Estados de oponentes: combina BD + locales
  const { finishedOpponents, scheduledOpponents } = useMemo(() => {
    const finished = new Set<string>();
    const scheduled = new Set<string>();
    if (!selectedTeam) return { finishedOpponents: finished, scheduledOpponents: scheduled };

    const consider = (m: Match) => {
      const isSelectedHome = m.homeTeam?.id === selectedTeam.id;
      const isSelectedAway = m.awayTeam?.id === selectedTeam.id;
      if (isSelectedHome || isSelectedAway) {
        const opponentId = isSelectedHome ? m.awayTeam?.id : m.homeTeam?.id;
        if (opponentId) {
          if (m.status === 'finished') finished.add(opponentId);
          else if (m.status === 'scheduled') scheduled.add(opponentId);
        }
      }
    };

    matches.forEach(consider);    // locales (forms)
    dbMatches.forEach(consider);  // BD (read-only)

    return { finishedOpponents: finished, scheduledOpponents: scheduled };
  }, [matches, dbMatches, selectedTeam]);

  const getTeamStatus = (teamId: string): 'played' | 'scheduled' | 'remaining' | 'self' | undefined => {
    if (!selectedTeam) return undefined;
    if (teamId === selectedTeam.id) return 'self';
    if (finishedOpponents.has(teamId)) return 'played';      // verde
    if (scheduledOpponents.has(teamId)) return 'scheduled';  // naranja
    return 'remaining';                                      // rojo (ajústalo en scheduling.css)
  };

  return (
    <div className="scheduling-panel">
      {/* Preload imágenes de canchas */}
      <div style={{ display: 'none' }}>
        {filteredVenues.flatMap(v => v.images).map(img => (<img key={img} src={img} alt="preload" />))}
      </div>

      <div className="panel-header">
        <h3>{tournament.name}</h3>
        <div className="header-actions">
          <span className="tournament-format">Formato: {tournament.format.replace('_', ' ').toUpperCase()}</span>
          <button className="btn-secondary" onClick={onBack}>← Volver a la lista</button>
        </div>
      </div>

      <div className="phase-tabs">
        {tournament.phases.map(phase => (
          <button
            key={phase}
            className={`phase-tab ${selectedPhase === phase ? 'active' : ''}`}
            onClick={() => setSelectedPhase(phase)}
          >
            {phase}
          </button>
        ))}
      </div>

      <div className="scheduler-layout">
        <div className="teams-list-container">
          <h4>Equipos Disponibles</h4>
          {selectedTeam && (
            <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
              Seleccionado: <strong>{selectedTeam.name}</strong> — Verde: jugó, Naranja: programado, Rojo: pendiente.
            </div>
          )}
          <TeamsTable
            teams={availableTeams}
            onDragStart={handleDragStart}
            onSelectTeam={handleSelectTeam}
            getTeamStatus={getTeamStatus}
          />

          <div className="scheduling-instructions">
            <h5>📋 Instrucciones:</h5>
            <ul>
              <li>Haz clic en “Añadir Partido” para crear el formulario.</li>
              <li>Arrastra equipos a los espacios del partido.</li>
              <li>Selecciona cancha y horario, y guarda.</li>
            </ul>
            <button className="btn-primary add-match-btn" onClick={addMatch}>➕ Añadir Partido</button>
          </div>
        </div>

        <div className="matches-container">
          <h4>Partidos de: {selectedPhase}</h4>

          {/* Ocultamos partidos existentes en BD para estética, pero se siguen usando en la lógica */}
          {/* // (Antes aquí se renderizaba "Programados en BD") */}

          {/* Formularios locales: SOLO aparecen si pulsas “Añadir Partido” */}
          {matches.length > 0 && (
            <div className="matches-grid">
              {matches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  venues={filteredVenues}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onRemoveTeam={removeTeamFromMatch}
                  onUpdateVenue={updateMatchVenue}
                  onUpdateDateTime={updateMatchDateTime}
                  onUpdateResult={updateMatchResult}
                  onSave={saveMatchToDB}
                  onDelete={deleteMatch}
                  tournamentSport={tournament.sport}
                />
              ))}
            </div>
          )}

          {/* Mensaje vacío solo cuando no hay formularios locales */}
          {matches.length === 0 && (
            <div className="no-matches">
              <p>No hay partidos para esta fase. Haz clic en “Añadir Partido” para crear uno.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------- Vista previa de cancha -----------------
const VenuePreview: React.FC<{ venue: Venue }> = ({ venue }) => {
  return (
    <div className="venue-preview">
      <strong>{venue.name}</strong>
      <div className="venue-images">
        {venue.images.map(src => (<img key={src} src={src} alt={venue.name} />))}
      </div>
    </div>
  );
};

// ----------------- Tarjeta de partido -----------------
interface MatchCardProps {
  match: Match;
  venues: Venue[];
  onDrop: (e: React.DragEvent, matchId: string, position: 'home' | 'away') => void;
  onDragOver: (e: React.DragEvent) => void;
  onRemoveTeam: (matchId: string, position: 'home' | 'away') => void;
  onUpdateVenue: (matchId: string, venueId: string) => void;
  onUpdateDateTime: (matchId: string, date: string, time: string) => void;
  onUpdateResult: (matchId: string, homeScore: number, awayScore: number) => void;
  onSave: (matchId: string) => void;
  onDelete: (matchId: string) => void;
  readOnly?: boolean;
  tournamentSport?: string; // 'futbol.salon' | 'futbol.7'
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  venues,
  onDrop,
  onDragOver,
  onRemoveTeam,
  onUpdateVenue,
  onUpdateDateTime,
  onUpdateResult,
  onSave,
  onDelete,
  readOnly = false,
  tournamentSport,
}) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const handleVenueHover = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    if (venue) {
      setSelectedVenue(venue);
      setShowPreview(true);
    }
  };

  const handleVenueLeave = () => {
    setShowPreview(false);
    setSelectedVenue(null);
  };

  const isComplete = match.homeTeam && match.awayTeam && match.venue && match.date && match.time;
  // Detección robusta de modalidad: acepta 'futbol7', 'fútbol7', 'futbol.7', 'f7'
  const sportNorm = (tournamentSport || '').toLowerCase();
  const modalityParam = /7|f7|futbol\.7/.test(sportNorm) ? 'futbol7' : 'futsal';

  return (
    <div className={`match-card ${readOnly ? 'readonly' : isComplete ? 'complete' : 'incomplete'}`}>
      {/* Equipos */}
      <div className="match-teams" onDragOver={!readOnly ? onDragOver : undefined}>
        <div
          className={`team-slot ${match.homeTeam ? 'filled' : 'empty'}`}
          onDrop={!readOnly ? (e) => onDrop(e, match.id, 'home') : undefined}
        >
          {match.homeTeam ? (
            <div className="team-info">
              <img src={match.homeTeam.logo} alt={match.homeTeam.name} />
              <span className="team-name">{match.homeTeam.name}</span>
              {!readOnly && (
                <button className="btn-small btn-danger" onClick={() => onRemoveTeam(match.id, 'home')}>✖</button>
              )}
            </div>
          ) : (
            <span className="empty-placeholder">{readOnly ? 'Sin equipo local' : 'Arrastra equipo local aquí'}</span>
          )}
        </div>

        <div
          className={`team-slot ${match.awayTeam ? 'filled' : 'empty'}`}
          onDrop={!readOnly ? (e) => onDrop(e, match.id, 'away') : undefined}
        >
          {match.awayTeam ? (
            <div className="team-info">
              <img src={match.awayTeam.logo} alt={match.awayTeam.name} />
              <span className="team-name">{match.awayTeam.name}</span>
              {!readOnly && (
                <button className="btn-small btn-danger" onClick={() => onRemoveTeam(match.id, 'away')}>✖</button>
              )}
            </div>
          ) : (
            <span className="empty-placeholder">{readOnly ? 'Sin equipo visitante' : 'Arrastra equipo visitante aquí'}</span>
          )}
        </div>
      </div>

      {/* Ajustes */}
      {!readOnly ? (
        <div className="match-settings">
          <div className="field">
            <label>Cancha</label>
            <select
              value={match.venue || ''}
              onChange={(e) => onUpdateVenue(match.id, e.target.value)}
              onMouseEnter={() => { if (match.venue) handleVenueHover(match.venue); }}
              onMouseLeave={handleVenueLeave}
            >
              <option value="">Selecciona cancha</option>
              {venues.map(v => (<option key={v.id} value={v.id}>{v.name}</option>))}
            </select>
          </div>

          <div className="field">
            <label>Fecha</label>
            <input type="date" value={match.date || ''} onChange={(e) => onUpdateDateTime(match.id, e.target.value, match.time || '')} />
          </div>

          <div className="field">
            <label>Hora</label>
            <input type="time" value={match.time || ''} onChange={(e) => onUpdateDateTime(match.id, match.date || '', e.target.value)} />
          </div>

          <div className="actions">
            <button className="btn-primary" onClick={() => onSave(match.id)} disabled={!isComplete}>Guardar</button>
            <button className="btn-secondary" onClick={() => onDelete(match.id)}>Eliminar</button>
            <button
              className="btn-secondary"
              disabled={!match.dbId || !isComplete}
              onClick={() => {
                if (match.dbId) {
                  const url = `/api/planilla/${match.dbId}?modality=${modalityParam}`;
                  window.open(url, '_blank');
                }
              }}
            >
              Descargar planilla
            </button>
          </div>
        </div>
      ) : (
        <div className="match-settings readonly-summary">
          <div className="readonly-item">
            <strong>Cancha:</strong>{' '}
            {match.venue ? (venues.find(v => v.id === match.venue)?.name ?? match.venue) : 'Sin cancha'}
          </div>
          <div className="readonly-item">
            <strong>Fecha:</strong> {match.date ?? 'Sin fecha'}
          </div>
          <div className="readonly-item">
            <strong>Hora:</strong> {match.time ?? 'Sin hora'}
          </div>
          <div className="readonly-item">
            <strong>Estado:</strong> {match.status === 'finished' ? 'Finalizado' : 'Programado'}
          </div>
        </div>
      )}

      {showPreview && selectedVenue && !readOnly && (
        <div className="venue-preview-container">
          <VenuePreview venue={selectedVenue} />
        </div>
      )}
    </div>
  );
};

export default SchedulingPage;
