'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/admin-dashboard.css';
import '../../styles/scheduling.css';

// Tipos de datos
interface Tournament {
  id: number;
  name: string;
  logo: string;
  format: 'todos_contra_todos' | 'fase_grupos' | 'eliminatorias';
  phases: string[];
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
}

interface Venue {
  id: string;
  name: string;
  address: string;
}

// --- DATOS DE EJEMPLO ---
const mockTournaments: Tournament[] = [
  { 
    id: 1, 
    name: 'Copa de Verano 2024', 
    logo: '/images/masculino-futsal-1.png', 
    format: 'eliminatorias',
    phases: ['Fase de Grupos', 'Cuartos de Final', 'Semifinal', 'Final'] 
  },
  { 
    id: 2, 
    name: 'Liga Femenina Primavera', 
    logo: '/images/femenino-futsal-1.png', 
    format: 'todos_contra_todos',
    phases: ['Todos contra Todos'] 
  },
  { 
    id: 3, 
    name: 'Torneo Masculino F7', 
    logo: '/images/masculino-f7-1.png', 
    format: 'fase_grupos',
    phases: ['Fase de Grupos', 'Semifinal', 'Final'] 
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
  { id: 'venue-1', name: 'Cancha Principal', address: 'Centro Deportivo LCG' },
  { id: 'venue-2', name: 'Cancha Auxiliar', address: 'Centro Deportivo LCG' },
  { id: 'venue-3', name: 'Polideportivo Municipal', address: 'Calle 15 #20-30' },
  { id: 'venue-4', name: 'Cancha La Esperanza', address: 'Barrio La Esperanza' },
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

  // Generar partidos automáticamente según el formato del torneo
  const generateMatches = (phase: string) => {
    const newMatches: Match[] = [];
    
    if (tournament.format === 'todos_contra_todos') {
      // Generar todos los partidos posibles
      for (let i = 0; i < availableTeams.length; i++) {
        for (let j = i + 1; j < availableTeams.length; j++) {
          newMatches.push({
            id: `match-${i}-${j}`,
            phase,
            homeTeam: null,
            awayTeam: null,
            round: Math.floor(newMatches.length / (availableTeams.length / 2)) + 1
          });
        }
      }
    } else if (tournament.format === 'fase_grupos') {
      // Generar partidos para grupos (ejemplo: 2 grupos de 4 equipos)
      const groupSize = 4;
      const numGroups = Math.ceil(availableTeams.length / groupSize);
      
      for (let group = 0; group < numGroups; group++) {
        const groupLetter = String.fromCharCode(65 + group); // A, B, C...
        for (let i = 0; i < groupSize; i++) {
          for (let j = i + 1; j < groupSize; j++) {
            newMatches.push({
              id: `match-${group}-${i}-${j}`,
              phase,
              homeTeam: null,
              awayTeam: null,
              group: `Grupo ${groupLetter}`
            });
          }
        }
      }
    } else if (tournament.format === 'eliminatorias') {
      // Generar partidos eliminatorios
      let numMatches = 0;
      if (phase === 'Cuartos de Final') numMatches = 4;
      else if (phase === 'Semifinal') numMatches = 2;
      else if (phase === 'Final') numMatches = 1;
      else numMatches = Math.floor(availableTeams.length / 2);
      
      for (let i = 0; i < numMatches; i++) {
        newMatches.push({
          id: `match-${phase}-${i}`,
          phase,
          homeTeam: null,
          awayTeam: null
        });
      }
    }
    
    setMatches(newMatches);
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

  useEffect(() => {
    generateMatches(activePhase);
  }, [activePhase, tournament.format]);

  return (
    <div className="scheduling-panel">
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
              <li>Haz clic en "Generar Automático" para asignar equipos aleatoriamente</li>
              <li>Selecciona la cancha y horario para cada partido</li>
            </ul>
            <button 
              className="btn-primary auto-generate-btn"
              onClick={() => generateMatches(activePhase)}
            >
              🎲 Generar Automático
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
                venues={mockVenues}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onRemoveTeam={removeTeamFromMatch}
                onUpdateVenue={updateMatchVenue}
                onUpdateDateTime={updateMatchDateTime}
              />
            ))}
          </div>
          
          {matches.length === 0 && (
            <div className="no-matches">
              <p>No hay partidos programados para esta fase.</p>
              <button 
                className="btn-primary"
                onClick={() => generateMatches(activePhase)}
              >
                Generar Partidos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulingPage;