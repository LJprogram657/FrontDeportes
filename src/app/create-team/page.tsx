'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton';
import '..//styles/create-team.css';
import { useAuth } from '../../contexts/AuthContext';  // ← Ya no requerimos login

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
  // const { user, isAuthenticated } = useAuth();       // ← Quitado
  
  // DATOS LIMPIOS - SIN TORNEOS DE PRUEBA
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);

  // Cargar torneos reales del localStorage
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
      }
    };
    loadTournaments();
  }, []);

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

  // Remover jugador
  const removePlayer = (playerId: string) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.filter(player => player.id !== playerId)
    }));
  };

  // Actualizar datos del jugador
  const updatePlayer = (playerId: string, field: keyof Player, value: string) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map(player => 
        player.id === playerId ? { ...player, [field]: value } : player
      )
    }));
  };

  // Función profesional para comprimir imágenes
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convertir a base64 comprimido
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Función para monitorear el uso de almacenamiento
  const checkStorageUsage = () => {
    try {
      let usedSpace = 0;
      
      // Estimar espacio usado
      // Removida la función 'checkStorageUsage' y cualquier recorrido de localStorage
      // Antes:
      // for (let key in localStorage) { ... }
      // Ahora: no inspeccionamos el storage; toda la información proviene de la API

      const usedKB = Math.round(usedSpace / 1024);
      console.log(`📊 Almacenamiento usado: ${usedKB} KB`);
      
      // Advertir si se acerca al límite (asumiendo 5MB = 5120KB)
      if (usedKB > 4000) {
        console.warn('⚠️ Almacenamiento casi lleno, iniciando limpieza automática...');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error verificando almacenamiento:', error);
      return false;
    }
  };

  // Manejar foto del jugador con compresión profesional
  const handlePlayerPhoto = async (playerId: string, file: File | null) => {
    if (file) {
      try {
        // Mostrar indicador de procesamiento
        setFormData(prev => ({
          ...prev,
          players: prev.players.map(player =>
            player.id === playerId 
              ? { ...player, photoPreview: 'processing...' }
              : player
          )
        }));

        // Comprimir imagen
        const compressedBase64 = await compressImage(file, 300, 0.6);
        
        // Calcular tamaño
        const sizeKB = Math.round(compressedBase64.length / 1024);
        console.log(`📸 Foto comprimida: ${sizeKB} KB (original: ~${Math.round(file.size / 1024)} KB)`);
        
        setFormData(prev => ({
          ...prev,
          players: prev.players.map(player =>
            player.id === playerId 
              ? { ...player, photo: file, photoPreview: compressedBase64 }
              : player
          )
        }));
      } catch (error) {
        console.error('Error procesando imagen:', error);
        toast.error('Error al procesar la imagen. Intenta con una imagen más pequeña.');
      }
    }
  };

  // Manejar logo del equipo con compresión profesional
  const handleTeamLogo = async (file: File | null) => {
    if (file) {
      try {
        // Mostrar indicador de procesamiento
        setFormData(prev => ({
          ...prev,
          teamLogoPreview: 'processing...'
        }));

        // Comprimir imagen
        const compressedBase64 = await compressImage(file, 200, 0.7);
        
        // Calcular tamaño
        const sizeKB = Math.round(compressedBase64.length / 1024);
        console.log(`🏆 Logo comprimido: ${sizeKB} KB (original: ~${Math.round(file.size / 1024)} KB)`);
        
        setFormData(prev => ({
          ...prev,
          teamLogo: file,
          teamLogoPreview: compressedBase64
        }));
      } catch (error) {
        console.error('Error procesando logo:', error);
        toast.error('Error al procesar el logo. Intenta con una imagen más pequeña.');
      }
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

  // Enviar formulario con arquitectura profesional
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.selectedTournament) {
        toast.error('Selecciona un torneo');
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

  // Eliminar el bloqueo por autenticación
  // if (!isAuthenticated) { return (<div> ... </div>) }  // ← Quitar esta sección
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
            <p>Elige el torneo en el que deseas participar:</p>
            
            <div className="category-section">
              <h3>🌸 Torneos Femeninos</h3>
              <div className="tournaments-grid">
                {availableTournaments
                  .filter(t => t.category === 'femenino')
                  .map(tournament => (
                    <div key={tournament.id} className="tournament-card">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h4>{tournament.name}</h4>
                        <p className="tournament-code">Código: {tournament.code}</p>
                        <span className={`status-badge ${tournament.status}`}>
                          {tournament.status === 'active' ? 'Activo' : 'Próximamente'}
                        </span>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => selectTournament(tournament)}
                        disabled={tournament.status !== 'active'}
                      >
                        {tournament.status === 'active' ? 'Seleccionar' : 'No Disponible'}
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="category-section">
              <h3>⚽ Torneos Masculinos</h3>
              <div className="tournaments-grid">
                {availableTournaments
                  .filter(t => t.category === 'masculino')
                  .map(tournament => (
                    <div key={tournament.id} className="tournament-card">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h4>{tournament.name}</h4>
                        <p className="tournament-code">Código: {tournament.code}</p>
                        <span className={`status-badge ${tournament.status}`}>
                          {tournament.status === 'active' ? 'Activo' : 'Próximamente'}
                        </span>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => selectTournament(tournament)}
                        disabled={tournament.status !== 'active'}
                      >
                        {tournament.status === 'active' ? 'Seleccionar' : 'No Disponible'}
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Datos del Equipo */}
        {currentStep === 2 && formData.selectedTournament && (
          <div className="step-content">
            <div className="selected-tournament-info">
              <img src={formData.selectedTournament.logo} alt={formData.selectedTournament.name} />
              <div>
                <h3>{formData.selectedTournament.name}</h3>
                <p>Código: {formData.selectedTournament.code}</p>
              </div>
            </div>

            <h2>📝 Información del Equipo</h2>
            
            <form className="team-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="teamName">Nombre del Equipo *</label>
                  <input
                    type="text"
                    id="teamName"
                    value={formData.teamName}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                    placeholder="Ej: Tigres FC"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactPerson">Persona de Contacto *</label>
                  <input
                    type="text"
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="Nombre completo del responsable"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">Número de Contacto *</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="Ej: 3001234567"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="teamLogo">Logo del Equipo (Opcional)</label>
                  <div className="file-upload-area">
                    {formData.teamLogoPreview ? (
                      <div className="logo-preview">
                        <img src={formData.teamLogoPreview} alt="Logo del equipo" />
                        <button 
                          type="button" 
                          className="btn-remove-logo"
                          onClick={() => setFormData(prev => ({ ...prev, teamLogo: null, teamLogoPreview: '' }))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="teamLogo" className="file-upload-label">
                        <span>📷 Subir Logo</span>
                        <span className="file-info">PNG, JPG (máx. 2MB)</span>
                      </label>
                    )}
                    <input
                      type="file"
                      id="teamLogo"
                      accept="image/*"
                      onChange={(e) => handleTeamLogo(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
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
                        placeholder="Ej: 12345678"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Foto del Jugador *</label>
                      <div className="file-upload-area">
                        {player.photoPreview ? (
                          <div className="player-photo-preview">
                            <img src={player.photoPreview} alt={`${player.name} ${player.lastName}`} />
                            <button 
                              type="button"
                              className="btn-remove-photo"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  players: prev.players.map(p =>
                                    p.id === player.id 
                                      ? { ...p, photo: null, photoPreview: '' }
                                      : p
                                  )
                                }));
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="file-upload-label">
                            <span>📷 Subir Foto</span>
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
                  formData.players.some(p => !p.name || !p.lastName || !p.cedula || !p.photo) ||
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
};

// Eliminar exportación duplicada al final si existía:
// export default CreateTeamPage;