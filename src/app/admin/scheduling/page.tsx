'use client';

import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/admin-dashboard.css';
import '../../styles/scheduling.css';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

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

  // Cargar torneos reales del localStorage
  useEffect(() => {
    const loadTournaments = () => {
      try {
        const adminTournaments = JSON.parse(localStorage.getItem('admin_created_tournaments') || '[]');
        
        // Convertir al formato esperado
        const formattedTournaments: Tournament[] = adminTournaments.map((t: any) => ({
          id: t.id,
          name: t.name,
          logo: t.logo || '/images/default-tournament.png',
          format: t.format === 'round-robin' ? 'todos_contra_todos' : 'eliminatorias',
          phases: t.phases || ['Todos contra Todos'],
          sport: t.modality === 'futsal' ? 'futbol.salon' : 'futbol.7'
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
}

const TeamsTable: React.FC<TeamsTableProps> = ({ teams, onDragStart }) => {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f6f8' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Logo</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Equipo</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                No hay equipos registrados para este torneo todavía.
              </td>
            </tr>
          ) : (
            teams.map(team => (
              <tr 
                key={team.id}
                draggable
                onDragStart={() => onDragStart(team)}
                style={{ borderTop: '1px solid #e9ecef', cursor: 'grab' }}
                title="Arrastra esta fila hacia un partido"
              >
                <td style={{ padding: '0.75rem' }}>
                  <img 
                    src={team.logo} 
                    alt={team.name} 
                    style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} 
                  />
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                  {team.name}
                </td>
                <td style={{ padding: '0.75rem', fontSize: 12, color: '#6c757d' }}>
                  Arrastra a un partido
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

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

  // Filtrar canchas por deporte del torneo
  const filteredVenues = venues.filter(v => v.sports.includes(tournament.sport));

  // Cargar equipos registrados reales (API)
  const loadRegisteredTeams = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, { cache: 'no-store' });
      const serverTeams = await res.json();
      let unique: Team[] = serverTeams.map((t: any) => ({
        id: `team-${t.id}`,
        dbId: t.id,
        name: t.name,
        logo: t.logo || '/images/default-team.png',
      }));
  
      // Fallback/merge: también cargar aprobados desde localStorage
      try {
        const ls = JSON.parse(localStorage.getItem('team_registrations') || '[]');
        const approved = ls.filter((r: any) =>
          r.status === 'approved' &&
          ((r.tournamentId ?? r.tournament?.id) === tournament.id)
        );
        const localTeams: Team[] = approved.map((r: any) => ({
          id: `local-team-${r.id}`,
          dbId: r.id,
          name: r.teamName,
          logo: r.teamLogo || '/images/default-team.png',
        }));
        // Fusionar evitando duplicados
        const byKey = new Map<string, Team>();
        [...unique, ...localTeams].forEach(t => {
          byKey.set(`${t.dbId}-${t.name}`, t);
        });
        unique = Array.from(byKey.values());
      } catch (e) {
        // Ignorar errores de parseo de localStorage
      }
  
      setAvailableTeams(unique);
    } catch (error) {
      console.error('Error cargando equipos:', error);
      // Fallback final: solo localStorage
      try {
        const ls = JSON.parse(localStorage.getItem('team_registrations') || '[]');
        const approved = ls.filter((r: any) =>
          r.status === 'approved' &&
          ((r.tournamentId ?? r.tournament?.id) === tournament.id)
        );
        const localTeams: Team[] = approved.map((r: any) => ({
          id: `local-team-${r.id}`,
          dbId: r.id,
          name: r.teamName,
          logo: r.teamLogo || '/images/default-team.png',
        }));
        setAvailableTeams(localTeams);
      } catch (e) {
        setAvailableTeams([]);
      }
    }
  }, [tournament.id]);

  // Cargar al montar/actualizar torneo
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

  // REMOVIDO: generación automática de partidos
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
    const isComplete = match && match.homeTeam && match.awayTeam && match.venue && match.date && match.time;
    if (!isComplete) {
      toast.error('Completa equipos, cancha, fecha y hora antes de guardar');
      return;
    }
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: match!.phase,
          venue: match!.venue,
          date: match!.date,
          time: match!.time,
          round: match!.round ?? null,
          group: match!.group ?? null,
          homeTeamId: match!.homeTeam?.dbId ?? null,
          awayTeamId: match!.awayTeam?.dbId ?? null,
        }),
      });
      if (!res.ok) throw new Error('Error al guardar partido');
      const created = await res.json();
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, dbId: created.id } : m));
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
        const res = await fetch(`/api/matches/${match.dbId}`, { method: 'DELETE' });
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
  onUpdateResult,
  onSave,
  onDelete
}) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [homeScore, setHomeScore] = useState<number | ''>(typeof match.homeScore === 'number' ? match.homeScore : '');
  const [awayScore, setAwayScore] = useState<number | ''>(typeof match.awayScore === 'number' ? match.awayScore : '');

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

  const handleResultSubmit = () => {
    const hs = typeof homeScore === 'number' ? homeScore : NaN;
    const as = typeof awayScore === 'number' ? awayScore : NaN;
    if (Number.isFinite(hs) && Number.isFinite(as)) {
      onUpdateResult(match.id, hs, as);
    } else {
      toast.error('Ingresa marcadores válidos');
    }
  };

  return (
    <div 
      className={`match-card ${isComplete ? 'complete' : 'incomplete'} ${match.status}`}
      onMouseLeave={handleVenueLeave}
    >
      <div className="match-header">
        <span>{match.group || (match.round ? `Ronda ${match.round}` : '')}</span>
        <span className={`status-indicator ${isComplete ? 'complete' : 'incomplete'}`}>
          {isComplete ? (match.status === 'finished' ? '✔ Finalizado' : '✔ Programado') : '✖ Pendiente'}
        </span>
      </div>
      <div className="match-teams">
        <div 
          className="team-slot home"
          onDrop={(e) => onDrop(e, match.id, 'home')}
          onDragOver={onDragOver}
        >
          {match.homeTeam ? (
            <div className="assigned-team">
              <img src={match.homeTeam.logo} alt={match.homeTeam.name} />
              <span>{match.homeTeam.name}</span>
              <button onClick={() => onRemoveTeam(match.id, 'home')}>×</button>
            </div>
          ) : (
            <span className="placeholder">Local</span>
          )}
        </div>
        
        <span className="vs-separator">VS</span>

        <div 
          className="team-slot away"
          onDrop={(e) => onDrop(e, match.id, 'away')}
          onDragOver={onDragOver}
        >
          {match.awayTeam ? (
            <div className="assigned-team">
              <img src={match.awayTeam.logo} alt={match.awayTeam.name} />
              <span>{match.awayTeam.name}</span>
              <button onClick={() => onRemoveTeam(match.id, 'away')}>×</button>
            </div>
          ) : (
            <span className="placeholder">Visitante</span>
          )}
        </div>
      </div>
      <div className="match-details">
        <select 
          value={match.venue || ''} 
          onChange={(e) => onUpdateVenue(match.id, e.target.value)}
          onMouseEnter={() => handleVenueHover(match.venue || '')}
          className="venue-select"
          disabled={match.status === 'finished'}
        >
          <option value="" disabled>Seleccionar cancha</option>
          {venues.map((v: Venue) => (
            <option 
              key={v.id} 
              value={v.id}
              onMouseEnter={() => handleVenueHover(v.id)}
            >
              {v.name}
            </option>
          ))}
        </select>
        <input 
          type="date" 
          value={match.date || ''} 
          onChange={(e) => onUpdateDateTime(match.id, e.target.value, match.time || '')} 
          disabled={match.status === 'finished'}
        />
        <input 
          type="time" 
          value={match.time || ''} 
          onChange={(e) => onUpdateDateTime(match.id, match.date || '', e.target.value)} 
          disabled={match.status === 'finished'}
        />
      </div>
      {showPreview && selectedVenue && <VenuePreview venue={selectedVenue} />}
      {isComplete && match.status === 'scheduled' && (
        <div className="match-result-form">
          <input 
            type="number" 
            placeholder={`Res. ${match.homeTeam?.name || 'Local'}`}
            value={homeScore}
            onChange={(e) => {
              const val = e.target.value;
              const num = parseInt(val, 10);
              setHomeScore(Number.isFinite(num) ? num : '');
            }}
          />
          <input 
            type="number" 
            placeholder={`Res. ${match.awayTeam?.name || 'Visitante'}`}
            value={awayScore}
            onChange={(e) => {
              const val = e.target.value;
              const num = parseInt(val, 10);
              setAwayScore(Number.isFinite(num) ? num : '');
            }}
          />
          <button onClick={handleResultSubmit}>Guardar</button>
        </div>
      )}
      {match.status === 'finished' && (
        <div className="match-result-display">
          <span>{match.homeScore} - {match.awayScore}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          className="btn-primary"
          onClick={() => onSave(match.id)}
          disabled={!isComplete || !!match.dbId}
        >
          {match.dbId ? 'Guardado' : 'Guardar Partido'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => onDelete(match.id)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default SchedulingPage;