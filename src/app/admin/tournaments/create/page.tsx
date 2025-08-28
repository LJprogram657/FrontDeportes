'use client';

import React, { useState } from 'react';

interface PredeterminedTournament {
  code: string;
  name: string;
  logo: string;
  category: 'femenino' | 'masculino';
  availableFormats: string[];
  description: string;
}

interface TournamentFormData {
  tournamentCode: string;
  selectedTournament: PredeterminedTournament | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  location: string;
  format: string;
  prizePool: string;
  additionalNotes: string;
}

const CreateTournamentPage: React.FC = () => {
  // Torneos predeterminados con logos
  const predeterminedTournaments: PredeterminedTournament[] = [
    // Torneos Femeninos
    {
      code: 'LCG_FEM',
      name: 'Liga Comunal de Garzón Femenino',
      logo: '/images/tournaments/lcg-femenino.png',
      category: 'femenino',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Liga femenina de fútbol de la comunidad de Garzón'
    },
    {
      code: 'COPA_FEM',
      name: 'Copa Femenina Garzón',
      logo: '/images/tournaments/copa-femenina.png',
      category: 'femenino',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Copa anual de fútbol femenino'
    },
    
    // Torneos Masculinos
    {
      code: 'LCG_FUTBOL',
      name: 'Liga Comunal de Garzón - Fútbol',
      logo: '/images/tournaments/lcg-futbol.png',
      category: 'masculino',
      availableFormats: ['futbol', 'futbol-11', 'futbol-sintetica'],
      description: 'Liga masculina de fútbol tradicional'
    },
    {
      code: 'LCG_FUTBOL11',
      name: 'Liga Comunal de Garzón - Fútbol 11',
      logo: '/images/tournaments/lcg-futbol11.png',
      category: 'masculino',
      availableFormats: ['futbol', 'futbol-11', 'futbol-sintetica'],
      description: 'Liga masculina de fútbol 11 jugadores'
    },
    {
      code: 'LCG_SINTETICA',
      name: 'Liga Comunal de Garzón - Sintética',
      logo: '/images/tournaments/lcg-sintetica.png',
      category: 'masculino',
      availableFormats: ['futbol', 'futbol-11', 'futbol-sintetica'],
      description: 'Liga masculina en cancha sintética'
    }
  ];

  const [formData, setFormData] = useState<TournamentFormData>({
    tournamentCode: '',
    selectedTournament: null,
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxTeams: 16,
    location: '',
    format: '',
    prizePool: '',
    additionalNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTournamentSelect = (tournament: PredeterminedTournament) => {
    setFormData(prev => ({
      ...prev,
      tournamentCode: tournament.code,
      selectedTournament: tournament,
      format: tournament.availableFormats[0] // Seleccionar el primer formato disponible
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxTeams' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedTournament) {
      alert('Por favor selecciona un torneo');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tournamentData = {
        code: formData.tournamentCode,
        name: formData.selectedTournament.name,
        logo: formData.selectedTournament.logo,
        category: formData.selectedTournament.category,
        format: formData.format,
        startDate: formData.startDate,
        endDate: formData.endDate,
        registrationDeadline: formData.registrationDeadline,
        maxTeams: formData.maxTeams,
        location: formData.location,
        prizePool: formData.prizePool,
        additionalNotes: formData.additionalNotes,
        description: formData.selectedTournament.description
      };

      console.log('Creando torneo:', tournamentData);
      alert('¡Torneo creado exitosamente!');
      
      // Resetear formulario
      setFormData({
        tournamentCode: '',
        selectedTournament: null,
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        maxTeams: 16,
        location: '',
        format: '',
        prizePool: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error creando torneo:', error);
      alert('Error al crear el torneo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormatDisplayName = (format: string) => {
    const formatNames: { [key: string]: string } = {
      'todos-contra-todos': 'Todos Contra Todos',
      'fase-grupos-eliminatorias': 'Fase de Grupos y Eliminatorias',
      'futbol': 'Fútbol',
      'futbol-11': 'Fútbol 11',
      'futbol-sintetica': 'Fútbol Sintética'
    };
    return formatNames[format] || format;
  };

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">🏆 Creación de Torneos</h2>
        <p className="content-subtitle">Selecciona y configura un torneo predeterminado</p>
      </div>
      
      <div className="tournament-creation-container">
        {!formData.selectedTournament ? (
          <div className="tournament-selection">
            <h3>Selecciona un tipo de torneo:</h3>
            
            <div className="category-section">
              <h4>🌸 Torneos Femeninos</h4>
              <div className="tournaments-grid">
                {predeterminedTournaments
                  .filter(t => t.category === 'femenino')
                  .map(tournament => (
                    <div key={tournament.code} className="tournament-option">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h5>{tournament.name}</h5>
                        <p className="tournament-code">Código: {tournament.code}</p>
                        <p className="tournament-description">{tournament.description}</p>
                        <div className="tournament-formats">
                          <strong>Formatos disponibles:</strong>
                          <ul>
                            {tournament.availableFormats.map(format => (
                              <li key={format}>{getFormatDisplayName(format)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button 
                        className="btn-primary"
                        onClick={() => handleTournamentSelect(tournament)}
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="category-section">
              <h4>⚽ Torneos Masculinos</h4>
              <div className="tournaments-grid">
                {predeterminedTournaments
                  .filter(t => t.category === 'masculino')
                  .map(tournament => (
                    <div key={tournament.code} className="tournament-option">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h5>{tournament.name}</h5>
                        <p className="tournament-code">Código: {tournament.code}</p>
                        <p className="tournament-description">{tournament.description}</p>
                        <div className="tournament-formats">
                          <strong>Formatos disponibles:</strong>
                          <ul>
                            {tournament.availableFormats.map(format => (
                              <li key={format}>{getFormatDisplayName(format)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button 
                        className="btn-primary"
                        onClick={() => handleTournamentSelect(tournament)}
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="tournament-form-container">
            <div className="selected-tournament-header">
              <div className="selected-tournament-info">
                <img src={formData.selectedTournament.logo} alt={formData.selectedTournament.name} className="selected-logo" />
                <div>
                  <h3>{formData.selectedTournament.name}</h3>
                  <p>Código: {formData.selectedTournament.code}</p>
                </div>
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => setFormData(prev => ({ ...prev, selectedTournament: null, tournamentCode: '', format: '' }))}
              >
                ← Cambiar Torneo
              </button>
            </div>

            <form onSubmit={handleSubmit} className="tournament-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="format">Formato del Torneo *</label>
                  <select
                    id="format"
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    required
                  >
                    {formData.selectedTournament.availableFormats.map(format => (
                      <option key={format} value={format}>
                        {getFormatDisplayName(format)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="maxTeams">Número Máximo de Equipos *</label>
                  <select
                    id="maxTeams"
                    name="maxTeams"
                    value={formData.maxTeams}
                    onChange={handleInputChange}
                    required
                  >
                    <option value={8}>8 equipos</option>
                    <option value={16}>16 equipos</option>
                    <option value={32}>32 equipos</option>
                    <option value={64}>64 equipos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="startDate">Fecha de Inicio *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">Fecha de Finalización *</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="registrationDeadline">Fecha Límite de Registro *</label>
                  <input
                    type="date"
                    id="registrationDeadline"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Ubicación *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Estadio Municipal"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prizePool">Premio (Opcional)</label>
                  <input
                    type="text"
                    id="prizePool"
                    name="prizePool"
                    value={formData.prizePool}
                    onChange={handleInputChange}
                    placeholder="Ej: $1000, Trofeo, Medallas"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="additionalNotes">Notas Adicionales</label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Información adicional sobre el torneo, reglas especiales, etc."
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setFormData(prev => ({ ...prev, selectedTournament: null, tournamentCode: '', format: '' }))}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Torneo'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTournamentPage;