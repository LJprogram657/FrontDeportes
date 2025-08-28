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

  // Datos de ejemplo (en un caso real vendrían del backend)
  const mockRegistrations: TeamRegistration[] = [
    {
      id: 1,
      teamName: "Tigres FC",
      teamLogo: "/images/teams/tigres-fc.png",
      contactNumber: "3001234567",
      contactPerson: "Carlos Martínez",
      tournament: {
        id: 1,
        name: "Liga Comunal de Garzón - Fútbol",
        code: "LCG_FUTBOL",
        logo: "/images/tournaments/lcg-futbol.png"
      },
      players: [
        { id: 1, name: "Juan", lastName: "Pérez", cedula: "12345678", photo: "/images/players/player1.jpg" },
        { id: 2, name: "Luis", lastName: "González", cedula: "87654321", photo: "/images/players/player2.jpg" },
        { id: 3, name: "Miguel", lastName: "Rodríguez", cedula: "11223344", photo: "/images/players/player3.jpg" },
        { id: 4, name: "Pedro", lastName: "López", cedula: "55667788", photo: "/images/players/player4.jpg" },
        { id: 5, name: "Diego", lastName: "Martín", cedula: "99887766", photo: "/images/players/player5.jpg" }
      ],
      registrationDate: "2024-01-15",
      status: "pending",
      notes: "Equipo con experiencia en torneos locales"
    },
    {
      id: 2,
      teamName: "Águilas Doradas",
      contactNumber: "3109876543",
      contactPerson: "Ana Rodríguez",
      tournament: {
        id: 2,
        name: "Liga Comunal de Garzón Femenino",
        code: "LCG_FEM",
        logo: "/images/tournaments/lcg-femenino.png"
      },
      players: [
        { id: 6, name: "María", lastName: "García", cedula: "22334455", photo: "/images/players/player6.jpg" },
        { id: 7, name: "Carmen", lastName: "Jiménez", cedula: "66778899", photo: "/images/players/player7.jpg" },
        { id: 8, name: "Laura", lastName: "Moreno", cedula: "33445566", photo: "/images/players/player8.jpg" },
        { id: 9, name: "Sandra", lastName: "Vargas", cedula: "77889900", photo: "/images/players/player9.jpg" }
      ],
      registrationDate: "2024-01-18",
      status: "approved"
    },
    {
      id: 3,
      teamName: "Leones FC",
      teamLogo: "/images/teams/leones-fc.png",
      contactNumber: "3157654321",
      contactPerson: "Roberto Silva",
      tournament: {
        id: 3,
        name: "Liga Comunal de Garzón - Sintética",
        code: "LCG_SINTETICA",
        logo: "/images/tournaments/lcg-sintetica.png"
      },
      players: [
        { id: 10, name: "Andrés", lastName: "Castillo", cedula: "44556677", photo: "/images/players/player10.jpg" },
        { id: 11, name: "Sebastián", lastName: "Torres", cedula: "88990011", photo: "/images/players/player11.jpg" },
        { id: 12, name: "Nicolás", lastName: "Ramírez", cedula: "55667788", photo: "/images/players/player12.jpg" }
      ],
      registrationDate: "2024-01-20",
      status: "rejected",
      notes: "Documentación incompleta"
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const local = JSON.parse(localStorage.getItem('team_registrations') || '[]');
      // Unir primero los locales (nuevos) y luego los mock
      setRegistrations([...local, ...mockRegistrations]);
      setIsLoading(false);
    }, 500);

    // Escuchar cambios del storage (por si se abre en otra pestaña)
    const onStorage = () => {
      const local = JSON.parse(localStorage.getItem('team_registrations') || '[]');
      setRegistrations(prev => {
        // Mantener mock, actualizar locales
        const mocks = prev.filter(r => !String(r.id).startsWith('1')); // heurística simple si lo deseas
        return [...local, ...mocks];
      });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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