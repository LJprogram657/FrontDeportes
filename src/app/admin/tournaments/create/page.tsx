'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PredeterminedTournament {
  code: string;
  name: string;
  logo: string;
  category: 'femenino' | 'masculino';
  modality: 'futsal' | 'futbol7';
  availableFormats: string[];
  description: string;
}

interface CreatedTournament {
  id: number;
  name: string;
  description: string;
  sport: string;
  category: 'femenino' | 'masculino';
  modality: 'futsal' | 'futbol7';
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  location: string;
  format: string;
  prizePool: string;
  status: 'upcoming' | 'active' | 'completed';
  logo: string;
  origin: 'created';
  phases: string[];
}

const CreateTournamentPage: React.FC = () => {
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState<'masculino' | 'femenino'>('masculino');
  const [customModality, setCustomModality] = useState<'futsal' | 'futbol7'>('futsal');
  const [createdTournaments, setCreatedTournaments] = useState<CreatedTournament[]>([]);
  
  const router = useRouter();

  // Cargar torneos creados al inicializar
  useEffect(() => {
    const loadCreatedTournaments = () => {
      try {
        const stored = localStorage.getItem('admin_created_tournaments');
        if (stored) {
          const tournaments = JSON.parse(stored);
          setCreatedTournaments(tournaments);
        }
      } catch (error) {
        console.error('Error loading tournaments:', error);
      }
    };

    loadCreatedTournaments();
  }, []);

  // Función para limpiar localStorage si está lleno
  const clearLocalStorageIfNeeded = () => {
    try {
      // Intentar una operación de prueba
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // QuotaExceededError - localStorage lleno
        const confirmClear = window.confirm(
          'El almacenamiento local está lleno. ¿Quieres limpiar algunos datos para continuar? Esto eliminará registros antiguos pero mantendrá los torneos.'
        );
        
        if (confirmClear) {
          // Limpiar solo registros de equipos, mantener torneos
          localStorage.removeItem('team_registrations');
          alert('Datos de registros limpiados. Puedes continuar creando torneos.');
        }
      }
    }
  };

  const createAndRedirect = (base: { name: string; logo?: string | null; category: 'femenino' | 'masculino'; modality: 'futsal' | 'futbol7'; description?: string }) => {
    // Verificar espacio en localStorage antes de guardar
    clearLocalStorageIfNeeded();

    // Función para obtener logo por defecto basado en categoría y modalidad
    const getDefaultLogo = (category: 'femenino' | 'masculino', modality: 'futsal' | 'futbol7') => {
      if (category === 'femenino' && modality === 'futsal') {
        return '/images/femenino-futsal-1.png';
      } else if (category === 'femenino' && modality === 'futbol7') {
        return '/images/femenino-f7-1.png';
      } else if (category === 'masculino' && modality === 'futsal') {
        return '/images/masculino-futsal-1.png';
      } else if (category === 'masculino' && modality === 'futbol7') {
        return '/images/masculino-f7-1.png';
      }
      return '/images/logo.png'; // Fallback
    };

    const newTournament = {
      id: Date.now(),
      name: base.name,
      description: base.description || `Torneo de ${base.modality} ${base.category}`,
      sport: 'futbol',
      category: base.category,
      modality: base.modality,
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      maxTeams: 16,
      location: '',
      format: 'round-robin',
      prizePool: '',
      status: 'upcoming' as const,
      logo: base.logo || getDefaultLogo(base.category, base.modality),
      origin: 'created' as const,
      phases: ['round_robin']
    };

    const key = 'admin_created_tournaments';
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(newTournament);
      localStorage.setItem(key, JSON.stringify(list));
      
      // Actualizar la lista local
      setCreatedTournaments(list);
      
      // Limpiar el formulario
      setCustomName('');
      setCustomLogo(null);
      setCustomCategory('masculino');
      setCustomModality('futsal');
      setIsCreatingCustom(false);
      
      alert('¡Torneo creado exitosamente!');
      
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        clearLocalStorageIfNeeded();
        alert("Almacenamiento lleno. Intenta de nuevo después de limpiar datos.");
      } else {
        console.error("Error saving to localStorage", error);
        alert("No se pudo crear el torneo.");
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCustomLogo(null);
    }
  };

  const handleCustomSubmit = () => {
    if (!customName) {
      alert('Por favor, ingresa un nombre para el torneo.');
      return;
    }
    createAndRedirect({
      name: customName,
      logo: customLogo,
      category: customCategory,
      modality: customModality,
      description: `Torneo personalizado de ${customModality} ${customCategory}`
    });
  };

  const editTournament = (tournamentId: number) => {
    router.push(`/admin/tournaments/update?id=${tournamentId}`);
  };

  const deleteTournament = (tournamentId: number, tournamentName: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar el torneo "${tournamentName}"? Esta acción no se puede deshacer.`);
    
    if (confirmDelete) {
      try {
        const key = 'admin_created_tournaments';
        const currentTournaments = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedTournaments = currentTournaments.filter((t: CreatedTournament) => t.id !== tournamentId);
        
        localStorage.setItem(key, JSON.stringify(updatedTournaments));
        setCreatedTournaments(updatedTournaments);
        
        alert('Torneo eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando torneo:', error);
        alert('Error al eliminar el torneo');
      }
    }
  };

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">🏆 Creación de Torneos</h2>
        <p className="content-subtitle">Crea nuevos torneos y gestiona los existentes</p>
      </div>
      
      <div className="tournament-creation-container">
        {isCreatingCustom ? (
          <div className="tournament-form-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>Crear Torneo Personalizado</h3>
            <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="customName" style={{ fontWeight: 'bold' }}>Nombre del Torneo *</label>
                <input
                  type="text"
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ej: Copa de Amigos 2024"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="customLogo" style={{ fontWeight: 'bold' }}>Logo del Torneo (Opcional)</label>
                <input
                  type="file"
                  id="customLogo"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
                {customLogo && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img src={customLogo} alt="Vista previa" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="customCategory" style={{ fontWeight: 'bold' }}>Categoría *</label>
                <select
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as 'masculino' | 'femenino')}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="customModality" style={{ fontWeight: 'bold' }}>Modalidad *</label>
                <select
                  id="customModality"
                  value={customModality}
                  onChange={(e) => setCustomModality(e.target.value as 'futsal' | 'futbol7')}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                  <option value="futsal">Fútbol de Salón</option>
                  <option value="futbol7">Fútbol 7</option>
                </select>
              </div>
              <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => setIsCreatingCustom(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button onClick={handleCustomSubmit} className="btn-primary" style={{ flex: 1 }}>
                  Crear Torneo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="tournament-selection">
            {/* Sección para crear nuevo torneo */}
            <h3>Crear un nuevo torneo:</h3>
            <div className="tournaments-grid" style={{ marginBottom: '2rem' }}>
              <div className="tournament-option" onClick={() => setIsCreatingCustom(true)} style={{ cursor: 'pointer' }}>
                <div className="tournament-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
                  ➕
                </div>
                <div className="tournament-info">
                  <h5>Crear Torneo Personalizado</h5>
                  <p className="tournament-description">Define nombre, logo, género, modalidad y cupos</p>
                </div>
                <button className="btn-primary" onClick={() => setIsCreatingCustom(true)}>
                  Crear Nuevo
                </button>
              </div>
            </div>

            {/* Sección de torneos creados */}
            {createdTournaments.length > 0 && (
              <div className="created-tournaments-section">
                <h3>Torneos Creados:</h3>
                
                {/* Torneos Femeninos */}
                {createdTournaments.filter(t => t.category === 'femenino').length > 0 && (
                  <div className="tournament-category">
                    <h4>🏆 Torneos Femeninos</h4>
                    <div className="tournaments-grid">
                      {createdTournaments
                        .filter(tournament => tournament.category === 'femenino')
                        .map((tournament) => (
                          <div key={tournament.id} className="tournament-option">
                            <div className="tournament-logo">
                              <img src={tournament.logo} alt={tournament.name} />
                            </div>
                            <div className="tournament-info">
                              <h5>{tournament.name}</h5>
                              <p className="tournament-description">{tournament.description}</p>
                              <span className="tournament-modality">{tournament.modality === 'futsal' ? 'Fútbol de Salón' : 'Fútbol 7'}</span>
                            </div>
                            <div className="tournament-actions">
                              <button 
                                className="btn-primary" 
                                onClick={() => editTournament(tournament.id)}
                              >
                                Editar
                              </button>
                              <button 
                                className="btn-danger" 
                                onClick={() => deleteTournament(tournament.id, tournament.name)}
                                style={{ 
                                  backgroundColor: '#dc3545', 
                                  marginLeft: '0.5rem',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '4px',
                                  color: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Torneos Masculinos */}
                {createdTournaments.filter(t => t.category === 'masculino').length > 0 && (
                  <div className="tournament-category">
                    <h4>🏆 Torneos Masculinos</h4>
                    <div className="tournaments-grid">
                      {createdTournaments
                        .filter(tournament => tournament.category === 'masculino')
                        .map((tournament) => (
                          <div key={tournament.id} className="tournament-option">
                            <div className="tournament-logo">
                              <img src={tournament.logo} alt={tournament.name} />
                            </div>
                            <div className="tournament-info">
                              <h5>{tournament.name}</h5>
                              <p className="tournament-description">{tournament.description}</p>
                              <span className="tournament-modality">{tournament.modality === 'futsal' ? 'Fútbol de Salón' : 'Fútbol 7'}</span>
                            </div>
                            <div className="tournament-actions">
                              <button 
                                className="btn-primary" 
                                onClick={() => editTournament(tournament.id)}
                              >
                                Editar
                              </button>
                              <button 
                                className="btn-danger" 
                                onClick={() => deleteTournament(tournament.id, tournament.name)}
                                style={{ 
                                  backgroundColor: '#dc3545', 
                                  marginLeft: '0.5rem',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '4px',
                                  color: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="info-section" style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px', 
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <h4>📋 Flujo de Trabajo</h4>
              <p>1. <strong>Crear Torneo</strong> → Aquí creas y ves todos tus torneos</p>
              <p>2. <strong>Actualizar Información</strong> → Configura fechas, ubicación y detalles</p>
              <p>3. <strong>Registraciones</strong> → Gestiona equipos inscritos</p>
              <p>4. <strong>Programación</strong> → Programa partidos y horarios</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTournamentPage;