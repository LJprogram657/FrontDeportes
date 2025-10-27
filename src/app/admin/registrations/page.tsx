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

// RegistrationsPage component (cliente)
const RegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<TeamRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

 
  // Tipado explícito de la metadata de notificaciones
  interface RegistrationMeta {
    id: number;
    dismissed?: boolean;
    dismissedAt?: string;
  }

  const [registrationsMeta, setRegistrationsMeta] = useState<RegistrationMeta[]>([]);
  const [showDismissed, setShowDismissed] = useState<boolean>(false);

  // Marcar notificación como oculta sin borrar el registro aprobado
  const dismissNotification = (registrationId: number) => {
    const nextMeta = [...registrationsMeta];
    const idx = nextMeta.findIndex(m => m.id === registrationId);
    const entry = { id: registrationId, dismissed: true, dismissedAt: new Date().toISOString() };
    if (idx >= 0) nextMeta[idx] = { ...nextMeta[idx], ...entry };
    else nextMeta.push(entry);
    setRegistrationsMeta(nextMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(nextMeta));
  };

  // Restaurar notificación (quitar dismissed)
  const undismissNotification = (registrationId: number) => {
    const nextMeta = [...registrationsMeta];
    const idx = nextMeta.findIndex(m => m.id === registrationId);
    if (idx >= 0) {
      nextMeta[idx] = { ...nextMeta[idx], dismissed: false, dismissedAt: undefined };
      setRegistrationsMeta(nextMeta);
      localStorage.setItem('team_registrations_meta', JSON.stringify(nextMeta));
    }
  };

  // Aprobar en lote los registros visibles según filtros
  const approveVisibleRegistrations = () => {
    const toApproveIds = new Set(filteredRegistrations.filter(r => r.status !== 'approved').map(r => r.id));
    if (toApproveIds.size === 0) return;

    const next = registrations.map(r => (toApproveIds.has(r.id) ? { ...r, status: 'approved' } : r));
    setRegistrations(next);
    localStorage.setItem('team_registrations', JSON.stringify(next));
    toast.success(`Aprobados ${toApproveIds.size} registros visibles`);
  };

  // Filtrar y (opcionalmente) mostrar las notificaciones ocultas
  const filteredRegistrations = registrations.filter(r => {
    if (selectedTournament !== 'all') {
      const tName = r.tournament?.name;
      const tCode = r.tournament?.code;
      const tId   = r.tournamentId?.toString();
      const matches =
        tName === selectedTournament ||
        tCode === selectedTournament ||
        tId === selectedTournament;
      if (!matches) return false;
    }
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    const meta = registrationsMeta.find(m => m.id === r.id);
    if (!showDismissed && meta?.dismissed) return false;
    return true;
  });

  // Eliminar registro: si está aprobado, solo ocultar la notificación
  const handleDeleteRegistration = (reg: TeamRegistration) => {
    if (reg.status === 'approved') {
      dismissNotification(reg.id);
      return;
    }
    const updatedRegistrations = registrations.filter(r => r.id !== reg.id);
    setRegistrations(updatedRegistrations);
    localStorage.setItem('team_registrations', JSON.stringify(updatedRegistrations));

    const updatedMeta = registrationsMeta.filter(m => m.id !== reg.id);
    setRegistrationsMeta(updatedMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(updatedMeta));
  };

  // Actualizar estado del registro (approve/reject)
  const updateRegistrationStatus = (regId: number, status: 'approved' | 'rejected' | 'pending') => {
    const next = registrations.map(r => (r.id === regId ? { ...r, status } : r));
    setRegistrations(next);
    localStorage.setItem('team_registrations', JSON.stringify(next));
    toast.success(`Estado actualizado a: ${status}`);
  };

  // Filtrar y ocultar notificaciones "dismissed"
  const filteredRegistrations = registrations.filter(r => {
    if (selectedTournament !== 'all') {
      const tName = r.tournament?.name;
      const tCode = r.tournament?.code;
      const tId   = r.tournamentId?.toString();
      const matches =
        tName === selectedTournament ||
        tCode === selectedTournament ||
        tId === selectedTournament;
      if (!matches) return false;
    }
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    const meta = registrationsMeta.find(m => m.id === r.id);
    if (meta?.dismissed) return false;
    return true;
  });

  // Métricas visibles (según torneo seleccionado y ocultando dismissed)
  const visibleForStats = registrations.filter(r => {
    const meta = registrationsMeta.find(m => m.id === r.id);
    if (meta?.dismissed) return false;
    if (selectedTournament === 'all') return true;
    const tName = r.tournament?.name;
    const tCode = r.tournament?.code;
    const tId   = r.tournamentId?.toString();
    return tName === selectedTournament || tCode === selectedTournament || tId === selectedTournament;
  });
  const total = visibleForStats.length;
  const pendingCount  = visibleForStats.filter(r => r.status === 'pending').length;
  const approvedCount = visibleForStats.filter(r => r.status === 'approved').length;
  const rejectedCount = visibleForStats.filter(r => r.status === 'rejected').length;

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h2>Gestión de registro</h2>
      </div>

      <div className="registrations-container">
        <div className="filters-section">
          <div className="filters-grid">
            {/* Torneo */}
            <div className="filter-group">
              <label>Torneo</label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
              >
                <option value="all">Todos los torneos</option>
                {Array.from(
                  new Set(
                    registrations
                      .map(
                        (r) =>
                          r.tournament?.name ||
                          r.tournament?.code ||
                          r.tournamentId?.toString()
                      )
                      .filter(Boolean) as string[]
                  )
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="filter-group">
              <label>Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>

            {/* Mostrar ocultas */}
            <div className="filter-group">
              <label>Notificaciones</label>
              <label style={{ fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={showDismissed}
                  onChange={(e) => setShowDismissed(e.target.checked)}
                /> Mostrar ocultas
              </label>
            </div>

            {/* Acción en lote */}
            <div className="filter-group">
              <label>Acciones</label>
              <button className="btn-success" onClick={approveVisibleRegistrations}>
                Aprobar visibles
              </button>
            </div>
          </div>
        </div>

        {/* Métricas con tus clases originales */}
        <div className="registrations-stats">
          <div className="stat-card">
            <h4>Total</h4><div className="stat-number">{total}</div>
          </div>
          <div className="stat-card pending">
            <h4>Pendientes</h4><div className="stat-number">{pendingCount}</div>
          </div>
          <div className="stat-card approved">
            <h4>Aprobados</h4><div className="stat-number">{approvedCount}</div>
          </div>
          <div className="stat-card rejected">
            <h4>Rechazados</h4><div className="stat-number">{rejectedCount}</div>
          </div>
        </div>

        {/* Listado y detalle con el layout original */}
        {isLoading ? (
          <p>Cargando...</p>
        ) : filteredRegistrations.length === 0 ? (
          <div className="no-registrations">No hay registros.</div>
        ) : (
          <>
            <div className="registrations-grid">
              {filteredRegistrations.map((r) => {
                const meta = registrationsMeta.find(m => m.id === r.id);
                return (
                  <div key={r.id} className="registration-card">
                    <div className="registration-header">
                      <div className="team-info">
                        <img
                          className="team-logo-small"
                          src={r.teamLogo || '/images/default-team.png'}
                          alt={r.teamName}
                        />
                        <div>
                          <strong>{r.teamName}</strong>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {r.tournament?.name || r.tournament?.code || r.tournamentId}
                          </div>
                        </div>
                      </div>
                      <span className={`status-badge ${r.status}`}>{r.status}</span>
                    </div>

                    <div className="registration-details">
                      <p>Contacto: {r.contactPerson} — {r.contactNumber}</p>
                      <p>Fecha registro: {r.registrationDate}</p>
                      <p>Jugadores: {r.players?.length ?? 0}</p>
                      {r.notes && <p>Notas: {r.notes}</p>}
                    </div>

                    <div className="action-buttons">
                      <button className="btn-success" onClick={() => updateRegistrationStatus(r.id, 'approved')}>
                        Aprobar
                      </button>
                      <button className="btn-danger" onClick={() => updateRegistrationStatus(r.id, 'rejected')}>
                        Rechazar
                      </button>

                      {/* Eliminar vs Restaurar notificación */}
                      {meta?.dismissed ? (
                        <button className="btn btn-secondary" onClick={() => undismissNotification(r.id)}>
                          Restaurar notificación
                        </button>
                      ) : (
                        <button className="btn btn-danger" onClick={() => handleDeleteRegistration(r)}>
                          Eliminar
                        </button>
                      )}

                      <button className="btn btn-secondary" onClick={() => setSelectedRegistration(r)}>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedRegistration ? (
              <div className="registration-detail">
                <div className="detail-header">
                  <h4>Detalle de registro: {selectedRegistration.teamName}</h4>
                  <button className="btn btn-secondary" onClick={() => setSelectedRegistration(null)}>
                    Cerrar
                  </button>
                </div>
                <div className="detail-content">
                  <div className="team-section">
                    <div className="team-header">
                      <img
                        className="team-logo-large"
                        src={selectedRegistration.teamLogo || '/images/default-team.png'}
                        alt={selectedRegistration.teamName}
                      />
                      <div>
                        <strong>{selectedRegistration.teamName}</strong>
                        <div style={{ color: '#666' }}>
                          {selectedRegistration.tournament?.name || selectedRegistration.tournament?.code || selectedRegistration.tournamentId}
                        </div>
                        <div>Estado: <span className={`status-badge ${selectedRegistration.status}`}>{selectedRegistration.status}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="players-section">
                    <h5>Jugadores</h5>
                    <div className="players-grid">
                      {(selectedRegistration.players || []).map((p) => (
                        <div key={p.id} className="player-card">
                          <img className="player-photo" src={p.photo || '/images/default-team.png'} alt={p.name} />
                          <div>
                            <div><strong>{p.name} {p.lastName}</strong></div>
                            <div>Cédula: {p.cedula}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="actions-section">
                    <div className="action-buttons">
                      <button className="btn-success" onClick={() => updateRegistrationStatus(selectedRegistration.id, 'approved')}>
                        Aprobar
                      </button>
                      <button className="btn-danger" onClick={() => updateRegistrationStatus(selectedRegistration.id, 'rejected')}>
                        Rechazar
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteRegistration(selectedRegistration)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-registrations">Selecciona un registro para ver el detalle.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Exportar por defecto para cumplir con el contrato de Next.js Page
export default RegistrationsPage;