'use client';

import React, { useState, useEffect, useRef } from 'react';
import '../../styles/admin-dashboard.css';
import '../../styles/scheduling.css';

// Tipos de datos
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
}

interface Venue {
  id: string;
  name: string;
  address: string;
  images: string[]; // Cambiado de image: string
  sports: string[];
}

// --- DATOS DE EJEMPLO ---
const mockTournaments: Tournament[] = [
  { 
    id: 1, 
    name: 'Copa de Verano 2024', 
    logo: '/images/masculino-futsal-1.png', 
    format: 'eliminatorias',
    phases: ['Todos contra Todos', 'Fase de Grupos', 'Cuartos de Final', 'Semifinal', 'Final'],
    sport: 'futbol.salon'
  },
  { 
    id: 2, 
    name: 'Liga Femenina Primavera', 
    logo: '/images/femenino-futsal-1.png', 
    format: 'todos_contra_todos',
    phases: ['Todos contra Todos'],
    sport: 'futbol.salon'
  },
  { 
    id: 3, 
    name: 'Torneo Masculino F7', 
    logo: '/images/masculino-f7-1.png', 
    format: 'fase_grupos',
    phases: ['Fase de Grupos', 'Semifinal', 'Final'],
    sport: 'futbol.7'
  },
];

const mockTeams: Team[] = [
  { id: 'team-1', name: 'Los Invencibles', logo: '/images/logo.png' },
  { id: 'team-2', name: 'Guerreros FC', logo: '/images/logo.png' },
  { id: 'team-3', name: 'Atlético Garzón', logo: '/images/logo.png' },
  { id: 'team-4', name: 'Real Comunal', logo: '/images/logo.png' },
  { id: 'team-5', name: 'Furia Roja', logo: '/images/logo.png' },
  { id: 'team-6', name: 'Deportivo LCG', logo: '/images/logo.png' },
  { id: 'team-7', name: 'Titanes del Balón', logo: '/images/logo.png' },
  { id: 'team-8', name: 'Estrellas del Sur', logo: '/images/logo.png' },
];

const mockVenues: Venue[] = [
  {
    id: '1',
    name: 'Cancha Aries',
    address: 'Calle Ficticia 123',
    images: ['/images/DSC_3835.jpg', '/images/DSC_3839.jpg'],
    sports: ['futbol.pasto'],
  },
  {
    id: '2',
    name: 'Cancha Villa Deportiva',
    address: 'Avenida Siempre Viva 456',
    images: ['/images/DSC_3829.jpg'],
    sports: ['futbol.pasto'],
  },
  {
    id: '3',
    name: 'Bancarios',
    address: 'Calle Falsa 123',
    images: ['/images/DSC_3787.jpg', '/images/DSC_3791.jpg'],
    sports: ['futbol.salon'],
  },
  {
    id: '4',
    name: 'El Playon',
    address: 'Avenida Inventada 456',
    images: ['/images/DSC_3797.jpg', '/images/DSC_3803.jpg'],
    sports: ['futbol.salon'],
  },
  {
    id: '5',
    name: 'Villa Deportiva',
    address: 'Calle Imaginaria 789',
    images: ['/images/DSC_3816.jpg', '/images/DSC_3832.jpg'],
    sports: ['futbol.salon'],
  },
  {
    id: '6',
    name: 'Villa Lucia',
    address: 'Avenida Ficticia 012',
    images: ['/images/DSC_3808.jpg', '/images/DSC_3817.jpg'],
    sports: ['futbol.salon'],
  },
  {
    id: '7',
    name: 'El Reino',
    address: 'Avenida Principal 123',
    images: ['/images/DSC_3847.jpg', '/images/DSC_3850.jpg'],
    sports: ['futbol.7'],
  },
  {
    id: '8',
    name: 'El Templo',
    address: 'Avenida Secundaria 456',
    images: ['/images/DSC_3853.jpg', '/images/DSC_3858.jpg'],
    sports: ['futbol.7'],
  },
];

// --- FIN DE DATOS DE EJEMPLO ---


const SchedulingPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar torneos (debería usar los creados por el admin)
  useEffect(() => {
    // Por ahora, usamos los datos de ejemplo.
    // TODO: Cargar torneos desde localStorage ('admin_created_tournaments')
    setTournaments(mockTournaments);
    setIsLoading(false);
  }, []);

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

// Panel principal de programación para un torneo seleccionado
interface SchedulingPanelProps {
  tournament: Tournament;
  onBack: () => void;
}

const SchedulingPanel: React.FC<SchedulingPanelProps> = ({ tournament, onBack }) => {
  const [activePhase, setActivePhase] = useState(tournament.phases[0]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>(mockTeams);
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);

  // Filtrar canchas según el deporte del torneo
  useEffect(() => {
    const venues = mockVenues.filter(venue => venue.sports.includes(tournament.sport));
    setFilteredVenues(venues);
  }, [tournament]);

  // Añadir un nuevo partido manualmente
  const addMatch = () => {
    const newMatch: Match = {
      id: `match-${activePhase}-${matches.length + 1}`,
      phase: activePhase,
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

  useEffect(() => {
    // Limpiar partidos al cambiar de fase
    setMatches([]);
  }, [activePhase]);

  return (
    <div className="scheduling-panel">
      {/* Contenedor de precarga de imágenes */}
      <div style={{ display: 'none' }}>
        {filteredVenues.flatMap(venue => venue.images).map(img => (
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
        {tournament.phases.map(phase => (
          <button 
            key={phase}
            className={`phase-tab ${activePhase === phase ? 'active' : ''}`}
            onClick={() => setActivePhase(phase)}
          >
            {phase}
          </button>
        ))}
      </div>

      <div className="scheduler-layout">
        <div className="teams-list-container">
          <h4>Equipos Disponibles</h4>
          <div className="teams-grid">
            {availableTeams.map(team => (
              <div 
                key={team.id}
                className="team-card draggable"
                draggable
                onDragStart={() => handleDragStart(team)}
              >
                <img src={team.logo} alt={team.name} className="team-logo-small" />
                <span className="team-name">{team.name}</span>
              </div>
            ))}
          </div>
          
          <div className="scheduling-instructions">
            <h5>📋 Instrucciones:</h5>
            <ul>
              <li>Arrastra los equipos a los espacios de los partidos</li>
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
          <h4>Partidos de: {activePhase}</h4>
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

// Componente para una tarjeta de partido individual
interface MatchCardProps {
  match: Match;
  venues: Venue[];
  onDrop: (e: React.DragEvent, matchId: string, position: 'home' | 'away') => void;
  onDragOver: (e: React.DragEvent) => void;
  onRemoveTeam: (matchId: string, position: 'home' | 'away') => void;
  onUpdateVenue: (matchId: string, venueId: string) => void;
  onUpdateDateTime: (matchId: string, date: string, time: string) => void;
  onUpdateResult: (matchId: string, homeScore: number, awayScore: number) => void;
}

const VenuePreview: React.FC<{ venue: Venue }> = ({ venue }) => {
  if (!venue) return null;

  return (
    <div className="venue-preview-card">
      <h4>{venue.name}</h4>
      <p>{venue.address}</p>
      <div className="venue-preview-images">
        {venue.images.map((img, index) => (
          <img key={index} src={img} alt={`${venue.name} ${index + 1}`} />
        ))}
      </div>
    </div>
  );
};

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  venues, 
  onDrop, 
  onDragOver, 
  onRemoveTeam, 
  onUpdateVenue, 
  onUpdateDateTime,
  onUpdateResult
}) => {
  const [homeScore, setHomeScore] = useState(match.homeScore || '');
  const [awayScore, setAwayScore] = useState(match.awayScore || '');
  const [showPreview, setShowPreview] = useState(false);
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

  const handleResultSubmit = () => {
    if (typeof homeScore === 'number' && typeof awayScore === 'number') {
      onUpdateResult(match.id, homeScore, awayScore);
    }
  };

  return (
    <div 
      className={`match-card ${isComplete ? 'complete' : 'incomplete'} ${match.status}`}
      onMouseLeave={handleVenueLeave}
    >
      <div className="match-header">
        <span>{match.group || `Ronda ${match.round || ''}`}</span>
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
          {venues.map(v => (
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
            onChange={(e) => setHomeScore(parseInt(e.target.value, 10))}
          />
          <input 
            type="number" 
            placeholder={`Res. ${match.awayTeam?.name || 'Visitante'}`}
            value={awayScore}
            onChange={(e) => setAwayScore(parseInt(e.target.value, 10))}
          />
          <button onClick={handleResultSubmit}>Guardar</button>
        </div>
      )}
      {match.status === 'finished' && (
        <div className="match-result-display">
          <span>{match.homeScore} - {match.awayScore}</span>
        </div>
      )}
    </div>
  );
};

export default SchedulingPage;