'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../../components/BackButton';
import '../../app/styles/create-team.css';

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

const CreateTeamPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Torneos disponibles (los mismos del admin)
  const availableTournaments: Tournament[] = [
    {
      id: '1',
      name: 'Liga Comunal de Garzón Femenino',
      code: 'LCG_FEM',
      logo: '/images/tournaments/lcg-femenino.png',
      category: 'femenino',
      status: 'active'
    },
    {
      id: '2',
      name: 'Copa Femenina Garzón',
      code: 'COPA_FEM',
      logo: '/images/tournaments/copa-femenina.png',
      category: 'femenino',
      status: 'upcoming'
    },
    {
      id: '3',
      name: 'Liga Comunal de Garzón - Fútbol',
      code: 'LCG_FUTBOL',
      logo: '/images/tournaments/lcg-futbol.png',
      category: 'masculino',
      status: 'active'
    },
    {
      id: '4',
      name: 'Liga Comunal de Garzón - Fútbol 11',
      code: 'LCG_FUTBOL11',
      logo: '/images/tournaments/lcg-futbol11.png',
      category: 'masculino',
      status: 'active'
    },
    {
      id: '5',
      name: 'Liga Comunal de Garzón - Sintética',
      code: 'LCG_SINTETICA',
      logo: '/images/tournaments/lcg-sintetica.png',
      category: 'masculino',
      status: 'upcoming'
    }
  ];

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

  // Manejar foto del jugador
  const handlePlayerPhoto = (playerId: string, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          players: prev.players.map(player =>
            player.id === playerId 
              ? { ...player, photo: file, photoPreview: e.target?.result as string }
              : player
          )
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar logo del equipo
  const handleTeamLogo = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          teamLogo: file,
          teamLogoPreview: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
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

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Aquí se enviaría la solicitud al backend
      console.log('Enviando solicitud de equipo:', formData);
      
      // Simulación de envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('¡Solicitud de equipo enviada exitosamente! El administrador revisará tu solicitud pronto.');
      
      // Resetear formulario
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
      alert('Hubo un error al enviar la solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="auth-required">
          <h2>🔒 Inicia Sesión Requerida</h2>
          <p>Debes iniciar sesión para crear un equipo y participar en los torneos.</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

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

export default CreateTeamPage;