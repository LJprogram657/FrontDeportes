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
  tournamentId?: number;
  dbId?: number;
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<TeamRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = (): HeadersInit => {
    try {
      const token = localStorage.getItem('access_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  interface RegistrationMeta {
    id: number;
    dismissed?: boolean;
    dismissedAt?: string;
  }

  const [registrationsMeta, setRegistrationsMeta] = useState<RegistrationMeta[]>([]);
  const [showDismissed, setShowDismissed] = useState<boolean>(false);

  // Cargar notificaciones/meta desde localStorage si existen
  useEffect(() => {
    try {
      const savedMeta = localStorage.getItem('team_registrations_meta');
      if (savedMeta) setRegistrationsMeta(JSON.parse(savedMeta));
    } catch {
      // Ignorar errores de parseo
    }
  }, []);

  // Cargar registros desde API admin (elimina dependencia de localStorage)
  useEffect(() => {
    const loadRegistrations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tournaments/admin/teams`, {
          cache: 'no-store',
          headers: { ...authHeaders() },
        });
        if (!res.ok) throw new Error('No autorizado o error al cargar equipos');
        const teams = await res.json();
        const mapped: TeamRegistration[] = (Array.isArray(teams) ? teams : []).map((t: any) => ({
          id: Number(t.id),
          teamName: t.name,
          teamLogo: t.logo || '/images/default-team.png',
          contactNumber: t.contact_number || '',
          contactPerson: t.contact_person || '',
          tournament: {
            id: Number(t.tournament?.id ?? t.tournamentId ?? 0),
            name: t.tournament?.name ?? '',
            code: t.tournament?.code ?? '',
            logo: t.tournament?.logo ?? '/images/default-tournament.png',
          },
          players: Array.isArray(t.players)
            ? t.players.map((p: any) => ({
                id: Number(p.id ?? 0),
                name: p.name ?? '',
                lastName: p.lastName ?? '',
                cedula: p.cedula ?? '',
                photo: p.photo ?? '',
              }))
            : [],
          registrationDate: t.createdAt ?? new Date().toISOString(),
          status: (t.status as 'pending' | 'approved' | 'rejected') ?? 'pending',
          tournamentId: Number(t.tournamentId ?? t.tournament?.id ?? 0),
          dbId: Number(t.id),
          notes: t.notes ?? '',
        }));
        setRegistrations(mapped);
      } catch (e) {
        console.error(e);
        setRegistrations([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadRegistrations();
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

  // Aprobar registro: asegura existencia en BD (crea si falta) y aprueba
  const approveRegistration = async (reg: TeamRegistration) => {
    try {
      let teamDbId = reg.dbId;
      const tournamentId = reg.tournamentId ?? reg.tournament?.id;
      // Si no hay dbId, intenta buscar por nombre
      if (!teamDbId) {
        const lookup = await fetch(
          `/api/tournaments/admin/teams?tournament=${tournamentId}`,
          { cache: 'no-store', headers: { ...authHeaders() } }
        );
        if (lookup.ok) {
          const existingTeams = await lookup.json();
          const found = (Array.isArray(existingTeams) ? existingTeams : []).find((t: any) => t.name === reg.teamName);
          if (found) teamDbId = Number(found.id);
        }
      }
      // Si sigue sin existir, crearlo
      if (!teamDbId) {
        const create = await fetch(`/api/tournaments/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tournament: tournamentId,
            name: reg.teamName,
            logo: reg.teamLogo ?? null,
            contact_person: reg.contactPerson,
            contact_number: reg.contactNumber,
            players: (reg.players || []).map((p) => ({
              name: p.name,
              lastName: p.lastName,
              cedula: p.cedula,
              photo: p.photo ?? null,
            })),
          }),
        });
        if (!create.ok) {
          const msg = await create.json().catch(() => ({}));
          const composed = [msg?.error, msg?.details].filter(Boolean).join(' - ') || 'Error al registrar equipo en BD';
          throw new Error(composed);
        }
        const payload = await create.json();
        teamDbId = Number(payload?.team?.id);
      }
      // Aprobar
      const approve = await fetch(`/api/tournaments/teams/${teamDbId}/approve`, {
        method: 'POST',
        headers: { ...authHeaders() },
      });
      if (!approve.ok) {
        const msg = await approve.json().catch(() => ({}));
        const composed = [msg?.error, msg?.details].filter(Boolean).join(' - ') || 'Error al aprobar equipo';
        throw new Error(composed);
      }
      // Actualiza estado local
      setRegistrations((prev) => prev.map((r) => (r.id === reg.id ? { ...r, status: 'approved', dbId: teamDbId } : r)));
      toast.success('Equipo aprobado y sincronizado');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Error al aprobar');
    }
  };

  const rejectRegistration = async (reg: TeamRegistration) => {
    try {
      const teamId = reg.dbId;
      if (!teamId) throw new Error('Equipo no sincronizado en BD');
      const res = await fetch(`/api/tournaments/teams/${teamId}/reject`, {
        method: 'POST',
        headers: { ...authHeaders() },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        const composed = [msg?.error, msg?.details].filter(Boolean).join(' - ') || 'Error al rechazar equipo';
        throw new Error(composed);
      }
      setRegistrations((prev) => prev.map((r) => (r.id === reg.id ? { ...r, status: 'rejected' } : r)));
      toast.success('Equipo rechazado');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Error al rechazar');
    }
  };

  const deleteRegistration = async (reg: TeamRegistration) => {
    try {
      const teamId = reg.dbId;
      if (!teamId) throw new Error('Equipo no sincronizado en BD');
      const res = await fetch(`/api/tournaments/admin/teams/${teamId}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        const composed = [msg?.error, msg?.details].filter(Boolean).join(' - ') || 'Error al eliminar equipo';
        throw new Error(composed);
      }
      setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
      toast.success('Equipo eliminado');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  // Aprobar en lote los registros visibles según filtros
  const approveVisibleRegistrations = async () => {
    const pending = filteredRegistrations.filter((r) => r.status !== 'approved');
    if (pending.length === 0) return;
    for (const r of pending) {
      await approveRegistration(r);
    }
    toast.success(`Aprobados y sincronizados ${pending.length} registros`);
  };

  // Eliminar registro: si está aprobado, solo ocultar la notificación
  const handleDeleteRegistration = async (reg: TeamRegistration) => {
    if (reg.status === 'approved') {
      dismissNotification(reg.id);
      return;
    }
    await deleteRegistration(reg);
    const updatedMeta = registrationsMeta.filter((m) => m.id !== reg.id);
    setRegistrationsMeta(updatedMeta);
    localStorage.setItem('team_registrations_meta', JSON.stringify(updatedMeta));
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
            <div className="filter-group">
              <label>Estado</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Notificaciones</label>
              <label style={{ fontWeight: 400 }}>
                <input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} /> Mostrar ocultas
              </label>
            </div>
            <div className="filter-group">
              <label>Acciones</label>
              <button className="btn-success" onClick={approveVisibleRegistrations}>Aprobar visibles</button>
            </div>
          </div>
        </div>

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
                        <img className="team-logo-small" src={r.teamLogo || '/images/default-team.png'} alt={r.teamName} />
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
                      <button className="btn-success" onClick={() => approveRegistration(r)}>Aprobar</button>
                      <button className="btn-danger" onClick={() => rejectRegistration(r)}>Rechazar</button>

                      {meta?.dismissed ? (
                        <button className="btn btn-secondary" onClick={() => undismissNotification(r.id)}>Restaurar notificación</button>
                      ) : (
                        <button className="btn btn-danger" onClick={() => handleDeleteRegistration(r)}>Eliminar</button>
                      )}

                      <button className="btn btn-secondary" onClick={() => setSelectedRegistration(r)}>Ver detalle</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedRegistration ? (
              <div className="registration-detail">
                <div className="detail-header">
                  <h4>Detalle de registro: {selectedRegistration.teamName}</h4>
                  <button className="btn btn-secondary" onClick={() => setSelectedRegistration(null)}>Cerrar</button>
                </div>
                <div className="detail-content">
                  <div className="team-section">
                    <div className="team-header">
                      <img className="team-logo-large" src={selectedRegistration.teamLogo || '/images/default-team.png'} alt={selectedRegistration.teamName} />
                      <div>
                        <strong>{selectedRegistration.teamName}</strong>
                        <div style={{ color: '#666' }}>
                          {selectedRegistration.tournament?.name || selectedRegistration.tournament?.code || selectedRegistration.tournamentId}
                        </div>
                        <div>
                          Estado: <span className={`status-badge ${selectedRegistration.status}`}>{selectedRegistration.status}</span>
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
                      <button className="btn-success" onClick={() => approveRegistration(selectedRegistration)}>Aprobar</button>
                      <button className="btn-danger" onClick={() => rejectRegistration(selectedRegistration)}>Rechazar</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteRegistration(selectedRegistration)}>Eliminar</button>
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