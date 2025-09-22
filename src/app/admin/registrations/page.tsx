'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/admin-dashboard.css';

interface Player {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  photo: string;
}

interface TeamRegistration {
  id: number;
  teamName: string;
  teamLogo?: string;
  contactNumber: string;
  tournament: {
    id: number;
    name: string;
    code: string;
    logo: string;
  };
  players: Player[];
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  contactPerson: string;
  notes?: string;
}

const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<TeamRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar registros reales del localStorage
  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        setIsLoading(true);
        
        // Cargar registros de equipos del localStorage
        const teamRegistrations = JSON.parse(localStorage.getItem('team_registrations') || '[]');
        setRegistrations(teamRegistrations);
      } catch (error) {
        console.error('Error cargando registros:', error);
        setRegistrations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegistrations();
  }, []);
  const handleStatusChange = async (registrationId: number, newStatus: 'approved' | 'rejected') => {
    try {
      // Aquí iría la lógica para actualizar el estado en el backend
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: newStatus } : reg
      ));
      
      alert(`Solicitud ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente!`);
      setSelectedRegistration(null);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado. Inténtalo de nuevo.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      pending: 'status-badge pending',
      approved: 'status-badge approved',
      rejected: 'status-badge rejected'
    };
    
    const statusText = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };

    return (
      <span className={badgeClasses[status as keyof typeof badgeClasses]}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  const getTournaments = () => {
    const tournaments = registrations.map(reg => reg.tournament);
    const uniqueTournaments = tournaments.filter((tournament, index, self) => 
      index === self.findIndex(t => t.id === tournament.id)
    );
    return uniqueTournaments;
  };

  const filteredRegistrations = registrations.filter(reg => {
    const tournamentMatch = selectedTournament === 'all' || reg.tournament.id.toString() === selectedTournament;
    const statusMatch = selectedStatus === 'all' || reg.status === selectedStatus;
    return tournamentMatch && statusMatch;
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando solicitudes de registro...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">👥 Gestión de Registro</h2>
        <p className="content-subtitle">Administra las solicitudes de equipos por torneo</p>
      </div>

      <div className="registrations-container">
        {!selectedRegistration ? (
          <>
            <div className="filters-section">
              <div className="filters-grid">
                <div className="filter-group">
                  <label htmlFor="tournament-filter">Filtrar por Torneo:</label>
                  <select
                    id="tournament-filter"
                    value={selectedTournament}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                  >
                    <option value="all">Todos los torneos</option>
                    {getTournaments().map(tournament => (
                      <option key={tournament.id} value={tournament.id.toString()}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="status-filter">Filtrar por Estado:</label>
                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobados</option>
                    <option value="rejected">Rechazados</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="registrations-stats">
              <div className="stat-card">
                <h4>Total</h4>
                <span className="stat-number">{filteredRegistrations.length}</span>
              </div>
              <div className="stat-card pending">
                <h4>Pendientes</h4>
                <span className="stat-number">{filteredRegistrations.filter(r => r.status === 'pending').length}</span>
              </div>
              <div className="stat-card approved">
                <h4>Aprobados</h4>
                <span className="stat-number">{filteredRegistrations.filter(r => r.status === 'approved').length}</span>
              </div>
              <div className="stat-card rejected">
                <h4>Rechazados</h4>
                <span className="stat-number">{filteredRegistrations.filter(r => r.status === 'rejected').length}</span>
              </div>
            </div>

            <div className="registrations-list">
              {filteredRegistrations.length === 0 ? (
                <div className="no-registrations">
                  <p>No hay solicitudes de registro que coincidan con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="registrations-grid">
                  {filteredRegistrations.map(registration => (
                    <div key={registration.id} className="registration-card">
                      <div className="registration-header">
                        <div className="team-info">
                          {registration.teamLogo && (
                            <img 
                              src={registration.teamLogo} 
                              alt={registration.teamName}
                              className="team-logo-small"
                            />
                          )}
                          <div>
                            <h4>{registration.teamName}</h4>
                            <p className="contact-person">Contacto: {registration.contactPerson}</p>
                          </div>
                        </div>
                        {getStatusBadge(registration.status)}
                      </div>

                      <div className="tournament-info">
                        <img 
                          src={registration.tournament.logo} 
                          alt={registration.tournament.name}
                          className="tournament-logo-small"
                        />
                        <div>
                          <strong>{registration.tournament.name}</strong>
                          <p>Código: {registration.tournament.code}</p>
                        </div>
                      </div>

                      <div className="registration-details">
                        <p><strong>Jugadores:</strong> {registration.players.length}</p>
                        <p><strong>Teléfono:</strong> {registration.contactNumber}</p>
                        <p><strong>Fecha:</strong> {new Date(registration.registrationDate).toLocaleDateString()}</p>
                      </div>

                      <button 
                        className="btn-primary"
                        onClick={() => setSelectedRegistration(registration)}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="registration-detail">
            <div className="detail-header">
              <h3>Detalles de la Solicitud</h3>
              <button 
                className="btn-secondary"
                onClick={() => setSelectedRegistration(null)}
              >
                ← Volver a la lista
              </button>
            </div>

            <div className="detail-content">
              <div className="team-section">
                <div className="team-header">
                  {selectedRegistration.teamLogo && (
                    <img 
                      src={selectedRegistration.teamLogo} 
                      alt={selectedRegistration.teamName}
                      className="team-logo-large"
                    />
                  )}
                  <div>
                    <h4>{selectedRegistration.teamName}</h4>
                    <p><strong>Persona de contacto:</strong> {selectedRegistration.contactPerson}</p>
                    <p><strong>Teléfono:</strong> {selectedRegistration.contactNumber}</p>
                    <p><strong>Fecha de registro:</strong> {new Date(selectedRegistration.registrationDate).toLocaleDateString()}</p>
                    {getStatusBadge(selectedRegistration.status)}
                  </div>
                </div>

                <div className="tournament-section">
                  <h5>Torneo:</h5>
                  <div className="tournament-info">
                    <img 
                      src={selectedRegistration.tournament.logo} 
                      alt={selectedRegistration.tournament.name}
                      className="tournament-logo-small"
                    />
                    <div>
                      <strong>{selectedRegistration.tournament.name}</strong>
                      <p>Código: {selectedRegistration.tournament.code}</p>
                    </div>
                  </div>
                </div>

                {selectedRegistration.notes && (
                  <div className="notes-section">
                    <h5>Notas:</h5>
                    <p>{selectedRegistration.notes}</p>
                  </div>
                )}
              </div>

              <div className="players-section">
                <h5>Jugadores ({selectedRegistration.players.length}):</h5>
                <div className="players-grid">
                  {selectedRegistration.players.map(player => (
                    <div key={player.id} className="player-card">
                      <img 
                        src={player.photo} 
                        alt={`${player.name} ${player.lastName}`}
                        className="player-photo"
                      />
                      <div className="player-info">
                        <h6>{player.name} {player.lastName}</h6>
                        <p>Cédula: {player.cedula}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRegistration.status === 'pending' && (
                <div className="actions-section">
                  <h5>Acciones:</h5>
                  <div className="action-buttons">
                    <button 
                      className="btn-success"
                      onClick={() => handleStatusChange(selectedRegistration.id, 'approved')}
                    >
                      ✓ Aprobar Solicitud
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleStatusChange(selectedRegistration.id, 'rejected')}
                    >
                      ✗ Rechazar Solicitud
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationsPage;