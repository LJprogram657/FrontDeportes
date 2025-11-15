'use client';

import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/admin-dashboard.css';
import '../../styles/scheduling.css';
import { toast } from 'sonner';

// Interfaces
interface Tournament {
  id: number;
  name: string;
  logo: string;
  format: 'todos_contra_todos' | 'fase_grupos' | 'eliminatorias';
  phases: string[];
  sport: string;
}

interface Team {
  id: string;
  name: string;
  logo: string;
  dbId: number;
  source?: 'server' | 'local';
}

interface Match {
  id: string;
  phase: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  date?: string;
  time?: string;
  venue?: string;
  round?: number;
  group?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'finished';
  dbId?: number;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  images: string[];
  sports: string[];
}

// Canchas básicas reales (puedes personalizar estas según tu ubicación)
const mockVenues: Venue[] = [
  {
    id: '1',
    name: 'Cancha Principal',
    address: 'Dirección por definir',
    images: ['/images/default-venue.jpg'],
    sports: ['futbol.salon', 'futbol.7'],
  },
  {
    id: '2',
    name: 'Cancha Auxiliar',
    address: 'Dirección por definir',
    images: ['/images/default-venue.jpg'],
    sports: ['futbol.salon', 'futbol.7'],
  }
];

// Componente principal
const SchedulingPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar torneos reales desde BD
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments', { cache: 'no-store' });
        const list = await res.json();

        const formattedTournaments: Tournament[] = (Array.isArray(list) ? list : []).map((t: any) => ({
          id: t.id,
          name: t.name,
          logo: t.logo || '/images/logo.png',
          format: 'todos_contra_todos',
          phases: ['Todos contra Todos'],
          sport: 'futbol.salon', // default; las canchas mock soportan ambos
        }));

        setTournaments(formattedTournaments);
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
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          margin: '2rem 0'
        }}>
          <h3>🏆 No hay torneos creados</h3>
          <p>Primero debes crear un torneo en la sección "Creación de Torneos"</p>
          <p>Luego podrás programar los partidos aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">📅 Programación de Partidos</h2>
        <p className="content-subtitle">
          {selectedTournament
            ? `Programando partidos para: ${selectedTournament.name}`
            : 'Selecciona un torneo para comenzar a programar los partidos.'}
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

// Componente para seleccionar un torneo
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

// Tabla de equipos (fuera de JSX del return)
interface TeamsTableProps {
  teams: Team[];
  onDragStart: (team: Team) => void;
  onSelectTeam?: (team: Team) => void; // NUEVO
  getTeamStatus?: (teamId: string) => 'played' | 'scheduled' | 'remaining' | 'self' | undefined; // NUEVO
}

// Dentro de TeamsTable
const TeamsTable: React.FC<TeamsTableProps> = ({ teams, onDragStart, onSelectTeam, getTeamStatus }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {teams.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d', background: '#fff', borderRadius: 6, border: '1px dashed #e0e0e0' }}>
          No hay equipos registrados para este torneo todavía.
        </div>
      ) : (
        <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
          {teams.map(team => {
            const status = getTeamStatus?.(team.id);
            const extraClass =
              status === 'played' ? 'played' :
              status === 'scheduled' ? 'scheduled' :
              status === 'self' ? 'selected' :
              'remaining';
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
}

// Panel principal de programación para un torneo seleccionado
interface SchedulingPanelProps {
  tournament: Tournament;
  onBack: () => void;
}

// Dentro del componente SchedulingPanel
const SchedulingPanel: React.FC<SchedulingPanelProps> = ({ tournament, onBack }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [venues] = useState<Venue[]>(mockVenues);
  const [selectedPhase, setSelectedPhase] = useState<string>(tournament.phases[0]);
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);

  // Header de autorización para rutas protegidas
  const authHeaders = (): HeadersInit => {
    try {
      const token = localStorage.getItem('access_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // Filtrar canchas por deporte del torneo
  const filteredVenues = venues.filter(v => v.sports.includes(tournament.sport));

  // Cargar equipos registrados reales (API) sin mezclar con localStorage
  const loadRegisteredTeams = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        cache: 'no-store',
        headers: { ...authHeaders() }
      });
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

  useEffect(() => {
    loadRegisteredTeams();
  }, [loadRegisteredTeams]);

  // Refrescar lista al volver a pestaña
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) loadRegisteredTeams();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadRegisteredTeams]);

  // Al cambiar de fase, limpiar la lista para añadir manualmente
  useEffect(() => {
    setMatches([]);
  }, [selectedPhase]);

  // Añadir un nuevo partido manualmente
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

  // Manejar drag and drop
  const handleDragStart = (team: Team) => {
    setDraggedTeam(team);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, matchId: string, position: 'home' | 'away') => {
    e.preventDefault();
    if (!draggedTeam) return;

    setMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        const updatedMatch = { ...match };
        if (position === 'home') {
          updatedMatch.homeTeam = draggedTeam;
        } else {
          updatedMatch.awayTeam = draggedTeam;
        }
        return updatedMatch;
      }
      return match;
    }));

    setDraggedTeam(null);
  };

  const removeTeamFromMatch = (matchId: string, position: 'home' | 'away') => {
    setMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        const updatedMatch = { ...match };
        if (position === 'home') {
          updatedMatch.homeTeam = null;
        } else {
          updatedMatch.awayTeam = null;
        }
        return updatedMatch;
      }
      return match;
    }));
  };

  const updateMatchVenue = (matchId: string, venue: string) => {
    setMatches(prev => prev.map(match =>
      match.id === matchId ? { ...match, venue } : match
    ));
  };

  const updateMatchDateTime = (matchId: string, date: string, time: string) => {
    setMatches(prev => prev.map(match =>
      match.id === matchId ? { ...match, date, time } : match
    ));
  };

  const updateMatchResult = (matchId: string, homeScore: number, awayScore: number) => {
    setMatches(prev => prev.map(match =>
      match.id === matchId ? { ...match, homeScore, awayScore, status: 'finished' } : match
    ));
  };

  // Guardar partido en BD (POST)
  const saveMatchToDB = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    const isComplete = match && match.homeTeam && match.awayTeam && match.venue && match?.date && match?.time;
    if (!isComplete || !match) {
      toast.error('Completa equipos, cancha, fecha y hora antes de guardar');
      return;
    }

    // Resolver IDs reales en BD (evitar IDs locales inexistentes)
    const resolveDbId = (team: Team | null) => {
      if (!team) return null;
      if (team.source === 'server' && Number.isFinite(team.dbId)) return team.dbId;
      const candidate = availableTeams.find(t => t.source === 'server' && t.name === team.name);
      return candidate?.dbId ?? null;
    };
    const homeDbId = resolveDbId(match.homeTeam);
    const awayDbId = resolveDbId(match.awayTeam);

    if (!homeDbId || !awayDbId) {
      toast.error('Los equipos deben estar aprobados y existentes en la base de datos antes de guardar el partido.');
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
    } catch (e) {
      console.error(e);
      toast.error('No se pudo guardar el partido');
    }
  };

  // Eliminar partido (DELETE si existe en BD)
  const deleteMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    try {
      if (match.dbId) {
        const res = await fetch(`/api/matches/${match.dbId}`, { method: 'DELETE', headers: { ...authHeaders() } });
        if (!res.ok) throw new Error('Error al eliminar en BD');
      }
      setMatches(prev => prev.filter(m => m.id !== matchId));
      toast.success('Partido eliminado');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar el partido');
    }
  };

  return (
    <div className="scheduling-panel">
      {/* Contenedor de precarga de imágenes */}
      <div style={{ display: 'none' }}>
        {filteredVenues.flatMap((venue: Venue) => venue.images).map((img: string) => (
          <img key={img} src={img} alt="preload" />
        ))}
      </div>

      <div className="panel-header">
        <h3>{tournament.name}</h3>
        <div className="header-actions">
          <span className="tournament-format">Formato: {tournament.format.replace('_', ' ').toUpperCase()}</span>
          <button className="btn-secondary" onClick={onBack}>← Volver a la lista</button>
        </div>
      </div>

      <div className="phase-tabs">
        {tournament.phases.map((phase: string) => (
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

          {/* Mini tabla dinámica con filas arrastrables */}
          <TeamsTable teams={availableTeams} onDragStart={handleDragStart} />

          <div className="scheduling-instructions">
            <h5>📋 Instrucciones:</h5>
            <ul>
              <li>Arrastra los equipos desde la tabla a los espacios de los partidos</li>
              <li>Selecciona la cancha y horario para cada partido</li>
            </ul>
            <button
              className="btn-primary add-match-btn"
              onClick={addMatch}
            >
              ➕ Añadir Partido
            </button>
          </div>
        </div>

        <div className="matches-container">
          <h4>Partidos de: {selectedPhase}</h4>
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
              />
            ))}
          </div>

          {matches.length === 0 && (
            <div className="no-matches">
              <p>No hay partidos para esta fase. Haz clic en "Añadir Partido" para crear uno.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Props del componente de tarjeta de partido
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
}

// Vista previa sencilla de cancha
const VenuePreview: React.FC<{ venue: Venue }> = ({ venue }) => {
  return (
    <div className="venue-preview">
      <strong>{venue.name}</strong>
      <div className="venue-images">
        {venue.images.map((src: string) => (
          <img key={src} src={src} alt={venue.name} />
        ))}
      </div>
    </div>
  );
};

// Componente para una tarjeta de partido individual
const MatchCard: React.FC<MatchCardProps> = ({
  match,
  venues,
  onDrop,
  onDragOver,
  onRemoveTeam,
  onUpdateVenue,
  onUpdateDateTime,
  onUpdateResult, // no lo usamos porque se eliminó el marcador
  onSave,
  onDelete
}) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const handleVenueHover = (venueId: string) => {
    const venue = venues.find((v: Venue) => v.id === venueId);
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

  return (
    <div className={`match-card ${isComplete ? 'complete' : 'incomplete'}`}>
      <div className="match-teams" onDragOver={onDragOver}>
        <div
          className={`team-slot ${match.homeTeam ? 'filled' : 'empty'}`}
          onDrop={(e) => onDrop(e, match.id, 'home')}
        >
          {match.homeTeam ? (
            <div className="team-info">
              <img src={match.homeTeam.logo} alt={match.homeTeam.name} />
              <span className="team-name">{match.homeTeam.name}</span>
              <button className="btn-small btn-danger" onClick={() => onRemoveTeam(match.id, 'home')}>✖</button>
            </div>
          ) : (
            <span className="empty-placeholder">Arrastra equipo local aquí</span>
          )}
        </div>

        <span className="vs-label">VS</span>

        <div
          className={`team-slot ${match.awayTeam ? 'filled' : 'empty'}`}
          onDrop={(e) => onDrop(e, match.id, 'away')}
        >
          {match.awayTeam ? (
            <div className="team-info">
              <img src={match.awayTeam.logo} alt={match.awayTeam.name} />
              <span className="team-name">{match.awayTeam.name}</span>
              <button className="btn-small btn-danger" onClick={() => onRemoveTeam(match.id, 'away')}>✖</button>
            </div>
          ) : (
            <span className="empty-placeholder">Arrastra equipo visitante aquí</span>
          )}
        </div>
      </div>

      <div className="match-details">
        <div className="detail-row">
          <label>Cancha</label>
          <select
            value={match.venue || ''}
            onChange={(e) => onUpdateVenue(match.id, e.target.value)}
            onMouseEnter={() => match.venue && handleVenueHover(match.venue)}
            onMouseLeave={handleVenueLeave}
          >
            <option value="">Selecciona una cancha</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {showPreview && selectedVenue && (
          <VenuePreview venue={selectedVenue} />
        )}

        <div className="detail-row">
          <label>Fecha</label>
          <input
            type="date"
            value={match.date || ''}
            onChange={(e) => onUpdateDateTime(match.id, e.target.value, match.time || '')}
          />
        </div>

        <div className="detail-row">
          <label>Hora</label>
          <input
            type="time"
            value={match.time || ''}
            onChange={(e) => onUpdateDateTime(match.id, match.date || '', e.target.value)}
          />
        </div>

        {/* Marcador eliminado */}
      </div>

      <div className="match-actions">
        <button className="btn-primary" onClick={() => onSave(match.id)} disabled={!isComplete}>
          💾 Guardar Partido
        </button>
        <button className="btn-danger" onClick={() => onDelete(match.id)}>
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
};

export default SchedulingPage;