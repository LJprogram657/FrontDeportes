'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton';
import '../styles/create-team.css';

interface Player {
  id: string;
  name: string;
  lastName: string;
  cedula: string;
  photo: File | null;
  photoPreview: string;
}

interface Tournament {
  id: string;
  name: string;
  code: string;
  logo: string;
  category: 'femenino' | 'masculino';
  status: 'active' | 'upcoming';
}

interface TeamFormData {
  teamName: string;
  selectedTournament: Tournament | null;
  teamLogo: File | null;
  teamLogoPreview: string;
  contactNumber: string;
  contactPerson: string;
  players: Player[];
}

export default function CreateTeamPage() {
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [formData, setFormData] = useState<TeamFormData>({
    teamName: '',
    selectedTournament: null,
    teamLogo: null,
    teamLogoPreview: '',
    contactNumber: '',
    contactPerson: '',
    players: []
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar torneos activos desde el backend
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments/active', { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudieron cargar torneos');
        const data = await res.json();
        const formattedTournaments = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: t.id.toString(),
          name: t.name,
          code: t.code || `TORNEO_${t.id}`,
          logo: t.logo || '/images/default-tournament.png',
          category: t.category,
          status: t.status,
        }));
        setAvailableTournaments(formattedTournaments);
      } catch (error) {
        console.error('Error cargando torneos:', error);
        setAvailableTournaments([]);
        toast.error('No se pudieron cargar los torneos activos');
      }
    };
    loadTournaments();
  }, []);

  // Añadir nuevo jugador
  const addPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: '',
      lastName: '',
      cedula: '',
      photo: null,
      photoPreview: ''
    };
    setFormData(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));
  };

  // Actualizar datos de un jugador
  const updatePlayer = (playerId: string, field: keyof Player, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === playerId ? { ...p, [field]: value } : p))
    }));
  };

  // Eliminar jugador
  const removePlayer = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
  };

  // Convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Manejar logo del equipo
  const handleTeamLogo = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, teamLogo: null, teamLogoPreview: '' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El logo no puede superar 2MB');
      return;
    }
    try {
      const preview = await fileToBase64(file);
      setFormData(prev => ({ ...prev, teamLogo: file, teamLogoPreview: preview }));
    } catch {
      toast.error('No se pudo procesar el logo');
    }
  };

  // Manejar foto de jugador
  const handlePlayerPhoto = async (playerId: string, file: File | null) => {
    if (!file) {
      updatePlayer(playerId, 'photo', null);
      updatePlayer(playerId, 'photoPreview', '');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La foto no puede superar 2MB');
      return;
    }
    updatePlayer(playerId, 'photoPreview', 'processing...');
    try {
      const preview = await fileToBase64(file);
      updatePlayer(playerId, 'photo', file);
      updatePlayer(playerId, 'photoPreview', preview);
    } catch {
      toast.error('No se pudo procesar la foto del jugador');
      updatePlayer(playerId, 'photoPreview', '');
    }
  };

  // Seleccionar torneo
  const selectTournament = (tournament: Tournament) => {
    setFormData(prev => ({
      ...prev,
      selectedTournament: tournament
    }));
    setCurrentStep(2);
  };

  // Validación de jugadores (mínimo 5, campos completos y cédulas únicas)
  const validatePlayers = (): boolean => {
    const players = (formData.players || []).map((p) => ({
      name: (p.name || '').trim(),
      lastName: (p.lastName || '').trim(),
      cedula: (p.cedula || '').trim(),
    }));

    if (players.length < 5) {
      toast.error('Añade al menos 5 jugadores');
      return false;
    }

    const missingIndices = players
      .map((p, i) => (!p.name || !p.lastName || !p.cedula ? i + 1 : null))
      .filter(Boolean) as number[];
    if (missingIndices.length) {
      toast.error(`Completa nombre, apellidos y cédula de jugadores #${missingIndices.join(', ')}`);
      return false;
    }

    const cedulas = players.map((p) => p.cedula);
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const c of cedulas) {
      if (seen.has(c)) duplicates.add(c);
      else seen.add(c);
    }
    if (duplicates.size) {
      toast.error(`Cédulas duplicadas: ${Array.from(duplicates).join(', ')}`);
      return false;
    }

    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.selectedTournament) {
        toast.error('Selecciona un torneo');
        setIsSubmitting(false);
        return;
      }
      // Validar jugadores antes de enviar (evita que el backend descarte y cambie el conteo)
      if (!validatePlayers()) {
        setIsSubmitting(false);
        return;
      }

      const payload = {
        tournament: Number(formData.selectedTournament.id),
        name: formData.teamName.trim(),
        logo: formData.teamLogoPreview || null,
        contact_person: formData.contactPerson.trim(),
        contact_number: formData.contactNumber.trim(),
        players: (formData.players || []).map(p => ({
          name: p.name.trim(),
          lastName: p.lastName.trim(),
          cedula: p.cedula.trim(),
          photo: p.photoPreview && p.photoPreview !== 'processing...' ? p.photoPreview : null,
        })),
      };

      const resp = await fetch('/api/tournaments/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = [result?.error, result?.details].filter(Boolean).join(' - ') || 'No se pudo registrar el equipo';
        throw new Error(msg);
      }

      toast.success('¡Solicitud de equipo enviada exitosamente! Pendiente de aprobación.');
      setFormData({
        teamName: '',
        selectedTournament: null,
        teamLogo: null,
        teamLogoPreview: '',
        contactNumber: '',
        contactPerson: '',
        players: []
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="back-button-container">
        <BackButton />
      </div>

      <div className="create-team-container">
        <div className="page-header">
          <h1>⚽ Crear Equipo</h1>
          <p>Registra tu equipo para participar en los torneos de la Liga Comunal de Garzón</p>
        </div>

        <div className="progress-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Seleccionar Torneo</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Datos del Equipo</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Jugadores</span>
          </div>
        </div>

        {/* PASO 1: Selección de Torneo */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>🏆 Selecciona un Torneo</h2>
            <div className="tournaments-grid">
              {availableTournaments.map((t) => (
                <div
                  key={t.id}
                  className="tournament-card"
                  onClick={() => selectTournament(t)}
                  role="button"
                  tabIndex={0}
                >
                  <img className="tournament-logo" src={t.logo} alt={t.name} />
                  <div className="tournament-info">
                    <strong>{t.name}</strong>
                    <span className="tournament-code">{t.code}</span>
                  </div>
                  <span className={`tournament-badge ${t.category}`}>{t.category}</span>
                </div>
              ))}
            </div>

            {availableTournaments.length === 0 && (
              <div className="empty-state">
                No hay torneos activos disponibles en este momento.
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!formData.selectedTournament) {
                    toast.error('Selecciona un torneo para continuar');
                    return;
                  }
                  setCurrentStep(2);
                }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Datos del Equipo */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>📋 Datos del Equipo</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre del Equipo *</label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                    placeholder="Nombre del equipo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Persona de Contacto *</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Nombre del responsable"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Número de Contacto *</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="Teléfono o celular"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Logo del Equipo (opcional)</label>
                  <div className="logo-upload">
                    {formData.teamLogoPreview ? (
                      <div className="team-logo-preview">
                        <img src={formData.teamLogoPreview} alt="Logo equipo" />
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={() => handleTeamLogo(null)}
                          aria-label="Remover logo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="file-upload">
                        <span>Subir logo</span>
                        <input
                          type="file"
                          id="teamLogo"
                          accept="image/*"
                          onChange={(e) => handleTeamLogo(e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(3)}
                  disabled={!formData.teamName || !formData.contactPerson || !formData.contactNumber}
                >
                  Continuar →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PASO 3: Jugadores */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>👥 Jugadores del Equipo</h2>
            <p>Añade los jugadores de tu equipo (mínimo 5, máximo 20):</p>

            <div className="players-list">
              {formData.players.map((player, index) => (
                <div key={player.id} className="player-form">
                  <div className="player-header">
                    <h4>Jugador #{index + 1}</h4>
                    {formData.players.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-player"
                        onClick={() => removePlayer(player.id)}
                      >
                        ✕ Eliminar
                      </button>
                    )}
                  </div>

                  <div className="player-form-grid">
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                        placeholder="Nombre del jugador"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Apellidos *</label>
                      <input
                        type="text"
                        value={player.lastName}
                        onChange={(e) => updatePlayer(player.id, 'lastName', e.target.value)}
                        placeholder="Apellidos del jugador"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Número de Cédula *</label>
                      <input
                        type="text"
                        value={player.cedula}
                        onChange={(e) => updatePlayer(player.id, 'cedula', e.target.value)}
                        placeholder="Cédula del jugador"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Foto (opcional)</label>
                      <div className="player-photo-preview">
                        {player.photoPreview ? (
                          <>
                            <img src={player.photoPreview} alt={player.name || 'Foto del jugador'} />
                            <button
                              type="button"
                              className="btn-remove-photo"
                              onClick={() => handlePlayerPhoto(player.id, null)}
                              aria-label="Remover foto"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <label className="file-upload">
                            <span>Subir foto</span>
                            <span className="file-info">PNG, JPG (máx. 2MB)</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePlayerPhoto(player.id, e.target.files?.[0] || null)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="players-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addPlayer}
                disabled={formData.players.length >= 20}
              >
                + Añadir Jugador ({formData.players.length}/20)
              </button>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                ← Volver
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={
                  formData.players.length < 5 ||
                  formData.players.some(p => !p.name || !p.lastName || !p.cedula) ||
                  isSubmitting
                }
              >
                {isSubmitting ? 'Enviando...' : `Enviar Solicitud (${formData.players.length} jugadores)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}