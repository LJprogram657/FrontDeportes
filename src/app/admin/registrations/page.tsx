'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
  // Fallback opcional si algunos registros guardaron solo el id
  tournamentId?: number;
  dbId?: number; // ← ID real en BD cuando se sincroniza
}

// RegistrationsPage component (cliente)
function RegistrationsPage() {
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

  // Cargar datos desde localStorage (si existen)
  useEffect(() => {
    try {
      const savedRegs = localStorage.getItem('team_registrations');
      const savedMeta = localStorage.getItem('team_registrations_meta');
      if (savedRegs) setRegistrations(JSON.parse(savedRegs));
      if (savedMeta) setRegistrationsMeta(JSON.parse(savedMeta));
    } catch {
      // Ignorar errores de parseo
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Marcar notificación como oculta sin borrar el registro aprobado
  const dismissNotification = (registrationId: number) => {
    const nextMeta = [...registrationsMeta];
    const idx = nextMeta.findIndex((m) => m.id === registrationId);
    const entry = { id: registrationId, dismissed: true, dismissedAt: new Date().toISOString() };
    if (idx >= 0) nextMeta[idx] = { ...nextMeta[idx], ...entry };
    else nextMeta.push(entry);
    setRegistrationsMeta(nextMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(nextMeta));
  };

  // Restaurar notificación (quitar dismissed)
  const undismissNotification = (registrationId: number) => {
    const nextMeta = [...registrationsMeta];
    const idx = nextMeta.findIndex((m) => m.id === registrationId);
    if (idx >= 0) {
      nextMeta[idx] = { ...nextMeta[idx], dismissed: false, dismissedAt: undefined };
      setRegistrationsMeta(nextMeta);
      localStorage.setItem('team_registrations_meta', JSON.stringify(nextMeta));
    }
  };

  // Filtrar y (opcionalmente) mostrar las notificaciones ocultas
  const filteredRegistrations = registrations.filter((r) => {
    if (selectedTournament !== 'all') {
      const tName = r.tournament?.name;
      const tCode = r.tournament?.code;
      const tId = r.tournamentId?.toString();
      const matches = tName === selectedTournament || tCode === selectedTournament || tId === selectedTournament;
      if (!matches) return false;
    }
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    const meta = registrationsMeta.find((m) => m.id === r.id);
    if (!showDismissed && meta?.dismissed) return false;
    return true;
  });

  // Aprobar en lote los registros visibles según filtros
  const approveVisibleRegistrations = async () => {
    const pending = filteredRegistrations.filter((r) => r.status !== 'approved');
    if (pending.length === 0) return;
    for (const r of pending) {
      await updateRegistrationStatus(r.id, 'approved');
    }
    toast.success(`Aprobados y sincronizados ${pending.length} registros`);
  };

  // Eliminar registro: si está aprobado, solo ocultar la notificación
  const handleDeleteRegistration = (reg: TeamRegistration) => {
    if (reg.status === 'approved') {
      dismissNotification(reg.id);
      return;
    }
    const updatedRegistrations: TeamRegistration[] = registrations.filter((r) => r.id !== reg.id);
    setRegistrations(updatedRegistrations);
    localStorage.setItem('team_registrations', JSON.stringify(updatedRegistrations));

    const updatedMeta = registrationsMeta.filter((m) => m.id !== reg.id);
    setRegistrationsMeta(updatedMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(updatedMeta));
  };

  // Actualizar estado del registro (approve/reject)
  const updateRegistrationStatus = async (regId: number, status: 'approved' | 'rejected' | 'pending') => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    // Si no es aprobación, sigue como antes
    if (status !== 'approved') {
      const next: TeamRegistration[] = registrations.map((r) => (r.id === regId ? { ...r, status } : r));
      setRegistrations(next);
      localStorage.setItem('team_registrations', JSON.stringify(next));
      toast.success(`Estado actualizado a: ${status}`);
      return;
    }

    // 1) Asegurar que el equipo exista en BD para este torneo
    const tournamentId = reg.tournament?.id ?? reg.tournamentId;
    if (!tournamentId) {
      toast.error('No se pudo determinar el torneo del registro');
      return;
    }

    // Intentar localizar equipo por nombre en BD
    let teamDbId: number | null = null;
    try {
      const lookup = await fetch(`/api/tournaments/admin/teams?tournament=${tournamentId}`, { cache: 'no-store' });
      if (lookup.ok) {
        const existingTeams = await lookup.json();
        const found = (Array.isArray(existingTeams) ? existingTeams : []).find((t: any) => t.name === reg.teamName);
        if (found) teamDbId = Number(found.id);
      }
    } catch {
      // Ignorar fallos de lookup
    }

    // Si no existe en BD, crearlo
    if (!teamDbId) {
      try {
        const create = await fetch(`/api/tournaments/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournament: Number(tournamentId),
            name: reg.teamName,
            logo: reg.teamLogo ?? null,
            contact_person: reg.contactPerson,
            contact_number: reg.contactNumber,
            players: (Array.isArray(reg.players) ? reg.players : []).map((p) => ({
              name: p.name,
              lastName: p.lastName,
              cedula: p.cedula,
              photo: p.photo ?? null,
            })),
          }),
        });
        if (!create.ok) {
          const msg = await create.json().catch(() => ({}));
          throw new Error(msg?.error || 'Error al registrar equipo en BD');
        }
        const payload = await create.json();
        teamDbId = Number(payload?.team?.id);
      } catch (e) {
        console.error(e);
        toast.error('No se pudo crear el equipo en la base de datos');
        return;
      }
    }

    // 2) Aprobar en BD
    try {
      const approve = await fetch(`/api/tournaments/teams/${teamDbId}/approve`, { method: 'POST' });
      if (!approve.ok) throw new Error('Error al aprobar equipo en BD');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo aprobar el equipo en la base de datos');
      return;
    }

    // 3) Actualizar localStorage con estado y dbId real
    const next: TeamRegistration[] = registrations.map((r) =>
      r.id === regId ? { ...r, status: 'approved', dbId: teamDbId! } : r
    );
    setRegistrations(next);
    localStorage.setItem('team_registrations', JSON.stringify(next));
    toast.success('Equipo aprobado y sincronizado en la base de datos');
  };

  // Métricas visibles (según torneo seleccionado y ocultando dismissed)
  const visibleForStats = registrations.filter((r) => {
    const meta = registrationsMeta.find((m) => m.id === r.id);
    if (meta?.dismissed) return false;
    if (selectedTournament === 'all') return true;
    const tName = r.tournament?.name;
    const tCode = r.tournament?.code;
    const tId = r.tournamentId?.toString();
    return tName === selectedTournament || tCode === selectedTournament || tId === selectedTournament;
  });

  const total = visibleForStats.length;
  const pendingCount = visibleForStats.filter((r) => r.status === 'pending').length;
  const approvedCount = visibleForStats.filter((r) => r.status === 'approved').length;
  const rejectedCount = visibleForStats.filter((r) => r.status === 'rejected').length;

  return (
    <>
      <div className="content-header registrations-header">
        <h2 className="content-title">Gestión de registro</h2>
        <p className="content-subtitle">Administra inscripciones por torneo y estado</p>
      </div>

      <div className="registrations-container">
        <div className="filters-section">
          <div className="filters-grid">
            {/* Torneo */}
            <div className="filter-group">
              <label>Torneo</label>
              <select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
                <option value="all">Todos los torneos</option>
                {Array.from(
                  new Set(
                    registrations
                      .map((r) => r.tournament?.name || r.tournament?.code || r.tournamentId?.toString())
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
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
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

        {/* Métricas */}
        <div className="registrations-stats">
          <div className="stat-card">
            <h4>Total</h4>
            <div className="stat-number">{total}</div>
          </div>
          <div className="stat-card pending">
            <h4>Pendientes</h4>
            <div className="stat-number">{pendingCount}</div>
          </div>
          <div className="stat-card approved">
            <h4>Aprobados</h4>
            <div className="stat-number">{approvedCount}</div>
          </div>
          <div className="stat-card rejected">
            <h4>Rechazados</h4>
            <div className="stat-number">{rejectedCount}</div>
          </div>
        </div>

        {/* Listado y detalle */}
        {isLoading ? (
          <p>Cargando...</p>
        ) : filteredRegistrations.length === 0 ? (
          <div className="no-registrations">No hay registros.</div>
        ) : (
          <>
            <div className="registrations-grid">
              {filteredRegistrations.map((r) => {
                const meta = registrationsMeta.find((m) => m.id === r.id);
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
                          {selectedRegistration.tournament?.name ||
                            selectedRegistration.tournament?.code ||
                            selectedRegistration.tournamentId}
                        </div>
                        <div>
                          Estado: <span className={`status-badge ${selectedRegistration.status}`}>
                            {selectedRegistration.status}
                          </span>
                        </div>
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
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

// Exportar por defecto para cumplir con el contrato de Next.js Page
export default RegistrationsPage;


async function approveTeam(teamId: number) {
  try {
    const res = await fetch(`/api/tournaments/teams/${teamId}/approve`, { method: 'POST' });
    if (!res.ok) throw new Error('No autorizado o error al aprobar');
    const updated = await res.json();
    // Actualiza tu estado/localStorage si lo mantienes para UI
    // y refresca listados desde la API para mantener consistencia
    toast.success('Equipo aprobado en la base de datos');
  } catch (e) {
    console.error(e);
    toast.error('No se pudo aprobar el equipo');
  }
}