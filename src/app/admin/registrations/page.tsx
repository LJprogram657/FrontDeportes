'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import '..//..//styles/admin-dashboard.css';

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
  // Fallback opcional si algunos registros guardaron solo el id
  tournamentId?: number;
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
        const teamRegistrations = JSON.parse(localStorage.getItem('team_registrations') || '[]');
        setRegistrations(Array.isArray(teamRegistrations) ? teamRegistrations : []);
      } catch (error) {
        console.error('Error cargando registros:', error);
        setRegistrations([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadRegistrations();
  }, []);

  // Sincronizar cambios entre pestañas/ventanas del navegador
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'team_registrations' || e.key === 'team_registrations_meta') {
        try {
          const list = JSON.parse(localStorage.getItem('team_registrations') || '[]');
          setRegistrations(Array.isArray(list) ? list : []);
        } catch (err) {
          console.warn('No se pudo recargar registros desde localStorage:', err);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleStatusChange = async (registrationId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const updated = registrations.map(reg =>
        reg.id === registrationId ? { ...reg, status: newStatus } : reg
      );
      setRegistrations(updated);

      // Persistir en localStorage para que “Programación” lo vea
      try {
        localStorage.setItem('team_registrations', JSON.stringify(updated));
        const metaList = JSON.parse(localStorage.getItem('team_registrations_meta') || '[]');
        const updatedMeta = Array.isArray(metaList)
          ? metaList.map((m: any) => (m.id === registrationId ? { ...m, status: newStatus } : m))
          : [];
        localStorage.setItem('team_registrations_meta', JSON.stringify(updatedMeta));
      } catch (storageError) {
        console.warn('No se pudo persistir el estado en localStorage:', storageError);
      }

      toast.success(`Solicitud ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente!`);
      setSelectedRegistration(null);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error al actualizar el estado. Inténtalo de nuevo.');
    }
  };

  const handleDeleteRegistration = (registrationId: number) => {
    const confirmDelete = window.confirm('¿Eliminar esta solicitud de equipo? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;

    try {
      const current = JSON.parse(localStorage.getItem('team_registrations') || '[]');
      const updated = Array.isArray(current) ? current.filter((reg: any) => reg.id !== registrationId) : [];
      localStorage.setItem('team_registrations', JSON.stringify(updated));
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));

      // Sincronizar metadata si existe
      try {
        const meta = JSON.parse(localStorage.getItem('team_registrations_meta') || '[]');
        const updatedMeta = Array.isArray(meta) ? meta.filter((m: any) => m.id !== registrationId) : [];
        localStorage.setItem('team_registrations_meta', JSON.stringify(updatedMeta));
      } catch (e) {
        console.warn('No se pudo actualizar team_registrations_meta:', e);
      }

      if (selectedRegistration?.id === registrationId) {
        setSelectedRegistration(null);
      }
      toast.success('Solicitud eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando solicitud:', error);
      toast.error('No se pudo eliminar la solicitud');
    }
  };

  const clearAllRegistrations = () => {
    const confirmClear = window.confirm('¿Eliminar TODAS las solicitudes de equipos? Esta acción no se puede deshacer.');
    if (!confirmClear) return;

    try {
      localStorage.removeItem('team_registrations');
      localStorage.removeItem('team_registrations_meta');
      setRegistrations([]);
      setSelectedRegistration(null);
      toast.success('Todas las solicitudes han sido eliminadas');
    } catch (error) {
      console.error('Error al limpiar solicitudes:', error);
      toast.error('No se pudieron eliminar las solicitudes');
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
    const map = new Map<number, { id: number; name: string; code: string; logo: string }>();
    registrations.forEach(reg => {
      const tid = reg.tournament?.id ?? reg.tournamentId;
      if (tid && !map.has(tid) && reg.tournament) {
        map.set(tid, reg.tournament);
      }
    });
    return Array.from(map.values());
  };

  const filteredRegistrations = registrations.filter(reg => {
    const tid = reg.tournament?.id ?? reg.tournamentId;
    const tournamentMatch = selectedTournament === 'all' || String(tid) === selectedTournament;
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

            {/* Botón global para limpiar todas las solicitudes */}
            <div className="actions-section" style={{ marginBottom: '10px' }}>
              <div className="action-buttons">
                <button className="btn-danger" onClick={clearAllRegistrations}>
                  🗑️ Eliminar todas las solicitudes
                </button>
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
                        {registration.tournament?.logo && (
                          <img
                            src={registration.tournament.logo}
                            alt={registration.tournament?.name || 'Torneo'}
                            className="tournament-logo-small"
                          />
                        )}
                        <div>
                          <strong>{registration.tournament?.name || 'Torneo'}</strong>
                          {registration.tournament?.code && (
                            <p>Código: {registration.tournament.code}</p>
                          )}
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
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteRegistration(registration.id)}
                        style={{ marginLeft: '8px' }}
                      >
                        Eliminar
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
                  {selectedRegistration?.teamLogo && (
                    <img
                      src={selectedRegistration.teamLogo}
                      alt={selectedRegistration.teamName}
                      className="team-logo-large"
                    />
                  )}
                  <div>
                    <h4>{selectedRegistration?.teamName}</h4>
                    <p><strong>Persona de contacto:</strong> {selectedRegistration?.contactPerson}</p>
                    <p><strong>Teléfono:</strong> {selectedRegistration?.contactNumber}</p>
                    <p><strong>Fecha de registro:</strong> {new Date(selectedRegistration!.registrationDate).toLocaleDateString()}</p>
                    {getStatusBadge(selectedRegistration!.status)}
                  </div>
                </div>

                <div className="tournament-section">
                  <h5>Torneo:</h5>
                  <div className="tournament-info">
                    {selectedRegistration?.tournament?.logo && (
                      <img
                        src={selectedRegistration.tournament.logo}
                        alt={selectedRegistration.tournament.name}
                        className="tournament-logo-small"
                      />
                    )}
                    <div>
                      <strong>{selectedRegistration?.tournament?.name}</strong>
                      {selectedRegistration?.tournament?.code && (
                        <p>Código: {selectedRegistration.tournament.code}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedRegistration?.notes && (
                  <div className="notes-section">
                    <h5>Notas:</h5>
                    <p>{selectedRegistration.notes}</p>
                  </div>
                )}
              </div>

              <div className="players-section">
                <h5>Jugadores ({selectedRegistration?.players.length}):</h5>
                <div className="players-grid">
                  {selectedRegistration?.players.map(player => (
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

              {/* Acciones de aprobación/rechazo/eliminación */}
              {selectedRegistration?.status === 'pending' && (
                <div className="actions-section" style={{ marginTop: '10px' }}>
                  <div className="action-buttons">
                    <button
                      className="btn-success"
                      onClick={() => handleStatusChange(selectedRegistration!.id, 'approved')}
                    >
                      Aprobar Solicitud
                    </button>
                    <button
                      className="btn-warning"
                      onClick={() => handleStatusChange(selectedRegistration!.id, 'rejected')}
                      style={{ marginLeft: '8px' }}
                    >
                      Rechazar Solicitud
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteRegistration(selectedRegistration!.id)}
                      style={{ marginLeft: '8px' }}
                    >
                      🗑️ Eliminar Solicitud
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