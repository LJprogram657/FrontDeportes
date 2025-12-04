'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// Componente interno para mostrar brackets por fase
const PhaseBracket: React.FC<{ phase: string }> = ({ phase }) => {
  return (
    <div className="bracket-container">
      <p>Visualización del bracket para la fase: <strong>{phase}</strong>.</p>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 text-gray-200">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{tournamentName}</h2>
          <p className="text-[#e31c25] flex items-center gap-2 font-medium">
            <span className="text-lg">📍</span> Acacías, Meta
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
          {['all-vs-all', 'groups', 'quarters', 'semis', 'final'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all relative ${
                activeTab === tab
                  ? 'text-white bg-white/5 border-b-2 border-[#e31c25]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'all-vs-all' && 'Todos contra Todos'}
              {tab === 'groups' && 'Fase de Grupos'}
              {tab === 'quarters' && 'Cuartos'}
              {tab === 'semis' && 'Semifinales'}
              {tab === 'final' && 'Final'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-white/5 min-h-[300px]">
          {activeTab === 'all-vs-all' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Resultados - Todos contra Todos</h3>
              <p className="text-gray-400">Contenido de la fase &quot;Todos contra todos&quot; próximamente.</p>
            </div>
          )}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Tabla de Posiciones - Fase de Grupos</h3>
              <p className="text-gray-400">Contenido de la &quot;Fase de Grupos&quot; próximamente.</p>
            </div>
          )}
          {['quarters', 'semis', 'final'].includes(activeTab) && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                {activeTab === 'quarters' && 'Cuartos de Final'}
                {activeTab === 'semis' && 'Semifinales'}
                {activeTab === 'final' && 'La Gran Final'}
              </h3>
              <PhaseBracket phase={activeTab} />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        <div className="bg-[#2a2a2a] p-6 rounded-xl border border-white/5 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6 border-l-4 border-[#e31c25] pl-3">
            Detalles del Torneo
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Cancha</h4>
              <p className="text-white font-medium">{tournamentInfo.cancha}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Fecha de Inicio</h4>
              <p className="text-white font-medium">{tournamentInfo.fechaInicio}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#e31c25] to-[#a3141b] p-6 rounded-xl shadow-lg text-white">
          <h3 className="text-xl font-bold mb-3">Estadísticas</h3>
          <p className="text-white/80 text-sm mb-4">
            Consulta las estadísticas completas del torneo, incluyendo goleadores y tarjetas.
          </p>
          <button className="w-full bg-white text-[#e31c25] font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors shadow-md">
            Ver Estadísticas
          </button>
        </div>
      </aside>
    </div>
  );
};

export default TournamentDetails;