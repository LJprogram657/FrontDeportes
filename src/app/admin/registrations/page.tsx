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

  // NUEVO: mantener metadata (notificaciones) separada
  const [registrationsMeta, setRegistrationsMeta] = useState<any[]>([]);

  // Cargar registros y metadatos desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem('team_registrations');
    setRegistrations(stored ? JSON.parse(stored) : []);

    const metaRaw = localStorage.getItem('team_registrations_meta');
    setRegistrationsMeta(metaRaw ? JSON.parse(metaRaw) : []);

    setIsLoading(false);
  }, []);

  // Sincronizar ante cambios en storage y al volver a la pestaña
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'team_registrations') {
        setRegistrations(e.newValue ? JSON.parse(e.newValue) : []);
      }
      if (e.key === 'team_registrations_meta') {
        setRegistrationsMeta(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', onStorage);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const stored = localStorage.getItem('team_registrations');
        setRegistrations(stored ? JSON.parse(stored) : []);

        const metaRaw = localStorage.getItem('team_registrations_meta');
        setRegistrationsMeta(metaRaw ? JSON.parse(metaRaw) : []);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Marcar notificación como dismiss sin borrar el registro aprobado
  const dismissNotification = (registrationId: number) => {
    const nextMeta = [...registrationsMeta];
    const idx = nextMeta.findIndex(m => m.id === registrationId);
    if (idx >= 0) {
      nextMeta[idx] = { ...nextMeta[idx], dismissed: true };
    } else {
      nextMeta.push({ id: registrationId, dismissed: true });
    }
    setRegistrationsMeta(nextMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(nextMeta));
  };

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

      <div className="filters">
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

      {/* Tarjetas de métricas */}
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

      {isLoading ? (
        <p>Cargando...</p>
      ) : filteredRegistrations.length === 0 ? (
        <div className="no-registrations">No hay registros.</div>
      ) : (
        <div className="registrations-grid">
          {filteredRegistrations.map((r) => (
            <div key={r.id} className="registration-card">
              <div className="registration-header">
                <div className="team-info">
                  {r.teamLogo ? (
                    <img className="team-logo-small" src={r.teamLogo} alt={r.teamName} />
                  ) : (
                    <img className="team-logo-small" src="/images/default-team.png" alt={r.teamName} />
                  )}
                  <div>
                    <strong>{r.teamName}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {r.tournament?.name || r.tournament?.code || r.tournamentId}
                    </div>
                  </div>
                </div>
                <span className={`status ${r.status}`}>{r.status}</span>
              </div>

              <div>
                <div>Contacto: {r.contactPerson} — {r.contactNumber}</div>
                <div>Fecha registro: {r.registrationDate}</div>
                <div>Jugadores: {r.players?.length ?? 0}</div>
                {r.notes && <div>Notas: {r.notes}</div>}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => updateRegistrationStatus(r.id, 'approved')}>
                  Aprobar
                </button>
                <button className="btn btn-secondary" onClick={() => updateRegistrationStatus(r.id, 'rejected')}>
                  Rechazar
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteRegistration(r)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Exportar por defecto para cumplir con el contrato de Next.js Page
export default RegistrationsPage;