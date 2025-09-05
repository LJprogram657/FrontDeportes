'use client';

import React, { useState, useEffect } from 'react';
import '../../../styles/tournament-form.css'; // <--- AÑADE ESTA LÍNEA

interface Tournament {
  id: number;
  name: string;
  description: string;
  sport: string;
  category: 'masculino' | 'femenino';
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  location: string;
  format: string;
  prizePool: string;
  status: 'active' | 'upcoming' | 'completed';
  phases?: ('round_robin' | 'group_stage' | 'quarterfinals' | 'semifinals' | 'final')[];
  logo?: string;
  origin?: 'created' | 'mock';
  modality?: 'futsal' | 'futbol7';
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
      format: "round-robin",
      prizePool: "$1000",
      status: "upcoming",
      origin: "mock",
      modality: "futbol7"
    },
    {
      id: 2,
      name: "Liga Femenina Primavera",
      description: "Torneo femenino de futsal",
      sport: "futbol",
      category: "femenino",
      startDate: "2024-03-01",
      endDate: "2024-04-15",
      registrationDeadline: "2024-02-25",
      maxTeams: 8,
      location: "Polideportivo Central",
      format: "round-robin",
      prizePool: "Trofeos y medallas",
      status: "active",
      modality: "futsal"
    }
  ];

  useEffect(() => {
    const key = 'admin_created_tournaments';
    const created = JSON.parse(localStorage.getItem(key) || '[]');
    const withPhases = created.map((t: any) => {
      const defaultPhases = t.phases
        ? t.phases
        : (t.format === 'grupos'
            ? ['group_stage', 'quarterfinals', 'semifinals', 'final']
            : ['round_robin']);
      return {
        ...t,
        phases: defaultPhases,
        origin: 'created'
      };
    });
    setTournaments([...withPhases, ...mockTournaments]);
    setIsLoading(false);
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

  const togglePhase = (phase: 'round_robin' | 'group_stage' | 'quarterfinals' | 'semifinals' | 'final') => {
    if (!selectedTournament) return;
    const phases = new Set(selectedTournament.phases || []);
    phases.has(phase) ? phases.delete(phase) : phases.add(phase);
    setSelectedTournament(prev => (prev ? { ...prev, phases: Array.from(phases) } : prev));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
  
    setIsUpdating(true);
    try {
      const updatedList = tournaments.map(t => 
        t.id === selectedTournament.id ? selectedTournament : t
      );
      setTournaments(updatedList);
  
      const key = 'admin_created_tournaments';
      const createdOnly = updatedList.filter(t => t.origin === 'created');
      localStorage.setItem(key, JSON.stringify(createdOnly));
  
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
              {tournaments.map(tournament => (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-header">
                    <h4>{tournament.name}</h4>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <div className="tournament-info">
                    <p><strong>Modalidad:</strong> {tournament.modality ? (tournament.modality === 'futsal' ? 'Fútbol de Salón' : 'Fútbol 7') : '-'}</p>
                    <p><strong>Género:</strong> {tournament.category}</p>
                    <p><strong>Fecha:</strong> {tournament.startDate} - {tournament.endDate}</p>
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
          ) : (
            <div className="tournament-form-container">
              <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <h3 style={{ marginBottom: 0, marginRight: '1rem' }}>
                    Actualizando: {selectedTournament.name}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge">{selectedTournament.modality === 'futsal' ? 'Fútbol de Salón' : 'Fútbol 7'}</span>
                    <span className="badge">{selectedTournament.category === 'masculino' ? 'Masculino' : 'Femenino'}</span>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => setSelectedTournament(null)}>
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
                    <label htmlFor="startDate">Fecha de Inicio</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={selectedTournament.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
  
                  <div className="form-group">
                    <label htmlFor="endDate">Fecha de Finalización</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={selectedTournament.endDate}
                      onChange={handleInputChange}
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

                  <div className="form-group full-width" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <label style={{ marginBottom: '1rem', display: 'block', fontWeight: 'bold' }}>Fases del Torneo</label>
                    <div className="phases-chips-container" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {(['round_robin', 'group_stage', 'quarterfinals', 'semifinals', 'final'] as const).map(phase => {
                        const phaseLabels: Record<string, string> = {
                          round_robin: 'Todos vs Todos',
                          group_stage: 'Fase de Grupos',
                          quarterfinals: 'Cuartos',
                          semifinals: 'Semifinal',
                          final: 'Final'
                        };
                        return (
                          <label 
                            key={phase} 
                            className={`phase-chip ${selectedTournament.phases?.includes(phase) ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTournament.phases?.includes(phase) || false}
                              onChange={() => togglePhase(phase)}
                              style={{ display: 'none' }}
                            />
                            {phaseLabels[phase]}
                          </label>
                        );
                      })}
                    </div>
                  </div>
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