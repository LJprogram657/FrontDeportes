'use client';

import React, { useState, useEffect } from 'react';

interface Tournament {
  id: number;
  name: string;
  description: string;
  sport: string;
  category: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  location: string;
  format: string;
  prizePool: string;
  status: 'active' | 'upcoming' | 'completed';
}

const UpdateTournamentPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Datos de ejemplo (en un caso real vendrían del backend)
  const mockTournaments: Tournament[] = [
    {
      id: 1,
      name: "Copa de Verano 2024",
      description: "Torneo de fútbol masculino",
      sport: "futbol",
      category: "masculino",
      startDate: "2024-02-15",
      endDate: "2024-02-28",
      registrationDeadline: "2024-02-10",
      maxTeams: 16,
      location: "Estadio Municipal",
      format: "eliminacion",
      prizePool: "$1000",
      status: "upcoming"
    },
    {
      id: 2,
      name: "Liga Femenina Primavera",
      description: "Liga de baloncesto femenino",
      sport: "basketball",
      category: "femenino",
      startDate: "2024-03-01",
      endDate: "2024-04-15",
      registrationDeadline: "2024-02-25",
      maxTeams: 8,
      location: "Polideportivo Central",
      format: "round-robin",
      prizePool: "Trofeos y medallas",
      status: "active"
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setTournaments(mockTournaments);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament({ ...tournament });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!selectedTournament) return;
    
    const { name, value } = e.target;
    setSelectedTournament(prev => ({
      ...prev!,
      [name]: name === 'maxTeams' ? parseInt(value) || 0 : value
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    setIsUpdating(true);
    
    try {
      // Aquí iría la lógica para actualizar el torneo en el backend
      console.log('Actualizando torneo:', selectedTournament);
      
      // Actualizar en el estado local
      setTournaments(prev => prev.map(t => 
        t.id === selectedTournament.id ? selectedTournament : t
      ));
      
      alert('Torneo actualizado exitosamente!');
      setSelectedTournament(null);
    } catch (error) {
      console.error('Error actualizando torneo:', error);
      alert('Error al actualizar el torneo. Inténtalo de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      active: 'status-badge active',
      upcoming: 'status-badge upcoming',
      completed: 'status-badge completed'
    };
    
    const statusText = {
      active: 'Activo',
      upcoming: 'Próximo',
      completed: 'Finalizado'
    };

    return (
      <span className={badgeClasses[status as keyof typeof badgeClasses]}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
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
        <p className="content-subtitle">Modifica la información de torneos existentes</p>
      </div>

      <div className="update-container">
        {!selectedTournament ? (
          <div className="tournaments-list">
            <h3>Selecciona un torneo para actualizar:</h3>
            <div className="tournaments-grid">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-header">
                    <h4>{tournament.name}</h4>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <div className="tournament-info">
                    <p><strong>Deporte:</strong> {tournament.sport}</p>
                    <p><strong>Categoría:</strong> {tournament.category}</p>
                    <p><strong>Fecha:</strong> {tournament.startDate} - {tournament.endDate}</p>
                    <p><strong>Ubicación:</strong> {tournament.location}</p>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => handleTournamentSelect(tournament)}
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="tournament-form-container">
            <div className="form-header">
              <h3>Actualizando: {selectedTournament.name}</h3>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedTournament(null)}
              >
                ← Volver a la lista
              </button>
            </div>

            <form onSubmit={handleUpdate} className="tournament-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Nombre del Torneo *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={selectedTournament.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sport">Deporte *</label>
                  <select
                    id="sport"
                    name="sport"
                    value={selectedTournament.sport}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="futbol">Fútbol</option>
                    <option value="basketball">Baloncesto</option>
                    <option value="volleyball">Voleibol</option>
                    <option value="tennis">Tenis</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Categoría *</label>
                  <select
                    id="category"
                    name="category"
                    value={selectedTournament.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Estado del Torneo *</label>
                  <select
                    id="status"
                    name="status"
                    value={selectedTournament.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="upcoming">Próximo</option>
                    <option value="active">Activo</option>
                    <option value="completed">Finalizado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="startDate">Fecha de Inicio *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={selectedTournament.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">Fecha de Finalización *</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={selectedTournament.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registrationDeadline">Fecha Límite de Registro *</label>
                  <input
                    type="date"
                    id="registrationDeadline"
                    name="registrationDeadline"
                    value={selectedTournament.registrationDeadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Ubicación *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={selectedTournament.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maxTeams">Número Máximo de Equipos *</label>
                  <select
                    id="maxTeams"
                    name="maxTeams"
                    value={selectedTournament.maxTeams}
                    onChange={handleInputChange}
                    required
                  >
                    <option value={8}>8 equipos</option>
                    <option value={16}>16 equipos</option>
                    <option value={32}>32 equipos</option>
                    <option value={64}>64 equipos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="format">Formato del Torneo *</label>
                  <select
                    id="format"
                    name="format"
                    value={selectedTournament.format}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="eliminacion">Eliminación Directa</option>
                    <option value="round-robin">Round Robin</option>
                    <option value="grupos">Fase de Grupos + Eliminatorias</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prizePool">Premio</label>
                  <input
                    type="text"
                    id="prizePool"
                    name="prizePool"
                    value={selectedTournament.prizePool}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Descripción del Torneo</label>
                <textarea
                  id="description"
                  name="description"
                  value={selectedTournament.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setSelectedTournament(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar Torneo'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateTournamentPage;