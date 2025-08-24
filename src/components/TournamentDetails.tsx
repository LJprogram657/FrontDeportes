'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// Datos de ejemplo para la fase de grupos
const groupStageData = [
  { group: 'Grupo A', team: 'Real Acacías', P: 9, W: 3, D: 0, L: 0, GF: 10, GA: 2, GD: 8 },
  { group: 'Grupo A', team: 'Atlético del Llano', P: 6, W: 2, D: 0, L: 1, GF: 5, GA: 4, GD: 1 },
  { group: 'Grupo A', team: 'Deportivo Centauros', P: 3, W: 1, D: 0, L: 2, GF: 3, GA: 7, GD: -4 },
  { group: 'Grupo A', team: 'Llaneros FC', P: 0, W: 0, D: 0, L: 3, GF: 1, GA: 6, GD: -5 },
];

// Componente interno para mostrar brackets por fase
const PhaseBracket: React.FC<{ phase: string }> = ({ phase }) => {
  return (
    <div className="bracket-container">
      <p>Visualización del bracket para la fase: <strong>{phase}</strong>.</p>
      {/* Aquí iría la lógica para renderizar solo los partidos de la fase correcta */}
    </div>
  );
};

const TournamentDetails: React.FC<{ tournamentName: string }> = ({ tournamentName }) => {
  const [activeTab, setActiveTab] = useState('all-vs-all');
  const [showAllTeams, setShowAllTeams] = useState(false);

  const tournamentInfo = {
    cancha: 'Estadio Municipal de Acacías',
    fechaInicio: '25 de Agosto, 2024',
  };

  // Lista de equipos más larga para el ejemplo
  const allTeams = [
    { name: 'Real Acacías', logo: '/images/logo-placeholder.png' },
    { name: 'Atlético del Llano', logo: '/images/logo-placeholder.png' },
    { name: 'Deportivo Centauros', logo: '/images/logo-placeholder.png' },
    { name: 'Llaneros FC', logo: '/images/logo-placeholder.png' },
    { name: 'Academia FC', logo: '/images/logo-placeholder.png' },
    { name: 'Unión Meta', logo: '/images/logo-placeholder.png' },
    { name: 'River Plate Acacías', logo: '/images/logo-placeholder.png' },
  ];

  const teamsToShow = showAllTeams ? allTeams : allTeams.slice(0, 4);

  return (
    <div className="tournament-details-layout">
      {/* Columna principal con las fases del torneo */}
      <div className="tournament-main-content">
        <h2>{tournamentName}</h2>
        <p className="tournament-location">📍 Acacías, Meta</p>

        <div className="tournament-tabs">
          <button onClick={() => setActiveTab('all-vs-all')} className={activeTab === 'all-vs-all' ? 'active' : ''}>Todos contra Todos</button>
          <button onClick={() => setActiveTab('groups')} className={activeTab === 'groups' ? 'active' : ''}>Fase de Grupos</button>
          <button onClick={() => setActiveTab('quarters')} className={activeTab === 'quarters' ? 'active' : ''}>Cuartos</button>
          <button onClick={() => setActiveTab('semis')} className={activeTab === 'semis' ? 'active' : ''}>Semifinales</button>
          <button onClick={() => setActiveTab('final')} className={activeTab === 'final' ? 'active' : ''}>Final</button>
        </div>

        <div className="tournament-content">
          {activeTab === 'all-vs-all' && (
            <div className="phase-content">
              <h3>Resultados - Todos contra Todos</h3>
              <p>Contenido de la fase "Todos contra todos" próximamente.</p>
            </div>
          )}
          {activeTab === 'groups' && (
            <div className="phase-content">
              <h3>Tabla de Posiciones - Fase de Grupos</h3>
              <p>Contenido de la "Fase de Grupos" próximamente.</p>
            </div>
          )}
          {activeTab === 'quarters' && (
            <div className="phase-content">
              <h3>Cuartos de Final</h3>
              <PhaseBracket phase="quarters" />
            </div>
          )}
          {activeTab === 'semis' && (
            <div className="phase-content">
              <h3>Semifinales</h3>
              <PhaseBracket phase="semis" />
            </div>
          )}
          {activeTab === 'final' && (
            <div className="phase-content">
              <h3>La Gran Final</h3>
              <PhaseBracket phase="final" />
            </div>
          )}
        </div>
      </div>

      {/* Nueva barra lateral con información adicional */}
      <aside className="tournament-sidebar">
        <div className="sidebar-info-box">
          <h3>Detalles del Torneo</h3>
          <div className="info-item">
            <h4>CANCHA</h4>
            <p>{tournamentInfo.cancha}</p>
          </div>
          <div className="info-item">
            <h4>FECHA DE INICIO</h4>
            <p>{tournamentInfo.fechaInicio}</p>
          </div>
        </div>
        <div className="sidebar-stats-box">
          <h3>Estadísticas</h3>
          <p>Consulta las estadísticas completas del torneo.</p>
          <button className="stats-button">Ver Estadísticas</button>
        </div>

        {/* Nueva caja para los equipos */}
        <div className="sidebar-teams-box">
          <h3>Equipos Participantes</h3>
          <ul className="team-list">
            {teamsToShow.map((team) => (
              <li key={team.name} className="team-item">
                <Image src={team.logo} alt={`Logo de ${team.name}`} width={40} height={40} className="team-logo" />
                <span>{team.name}</span>
              </li>
            ))}
          </ul>
          {!showAllTeams && allTeams.length > 4 && (
            <button onClick={() => setShowAllTeams(true)} className="view-more-button">
              Ver más equipos ({allTeams.length - 4} más)
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

export default TournamentDetails;