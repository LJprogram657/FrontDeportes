'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  const [availableLogos, setAvailableLogos] = useState<string[]>([]);

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

  const createAndRedirect = (base: { name: string; logo?: string | null; category: 'femenino' | 'masculino'; modality: 'futsal' | 'futbol7'; description?: string }) => {
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
      
      setCreatedTournaments(list);
      
      setCustomName('');
      setCustomLogo(null);
      setCustomCategory('masculino');
      setCustomModality('futsal');
      setIsCreatingCustom(false);
      
      toast.success('¡Torneo creado exitosamente!');
      
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        toast.error("Almacenamiento lleno. Intenta de nuevo después de limpiar datos.");
      } else {
        console.error("Error saving to localStorage", error);
        toast.error("No se pudo crear el torneo.");
      }
    }
  };

  useEffect(() => {
    const imageFiles = [
        'femenino-f7-1.png',
        'femenino-f7-2.png',
        'femenino-f7-3.png',
        'femenino-f7-4.png',
        'femenino-futsal-1.png',
        'femenino-futsal-2.png',
        'femenino-futsal-3.png',
        'femenino-futsal-4.png',
        'masculino-f7-1.png',
        'masculino-f7-2.png',
        'masculino-futsal-1.png',
    ];
    setAvailableLogos(imageFiles.map(file => `/images/${file}`));
  }, []);

  const handleCustomSubmit = () => {
    if (!customName) {
      toast.error('Por favor, ingresa un nombre para el torneo.');
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
        
        toast.success('Torneo eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando torneo:', error);
        toast.error('Error al eliminar el torneo');
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
                <label style={{ fontWeight: 'bold' }}>Logo del Torneo (Opcional)</label>
                <div className="logo-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '10px' }}>
                  {availableLogos.filter(logo => logo.includes(customCategory) && logo.includes(customModality.replace('futbol7', 'f7'))).map(logo => (
                      <div
                          key={logo}
                          className={`logo-option ${customLogo === logo ? 'selected' : ''}`}
                          onClick={() => setCustomLogo(logo)}
                          style={{
                              cursor: 'pointer',
                              border: customLogo === logo ? '3px solid #007bff' : '3px solid #eee',
                              borderRadius: '8px',
                              padding: '5px',
                              textAlign: 'center',
                              backgroundColor: customLogo === logo ? '#eef' : '#fff',
                          }}
                      >
                          <img src={logo} alt="Tournament Logo" style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                      </div>
                  ))}
                </div>
                {customLogo && (
                  <div style={{ marginTop: '1rem', textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 'bold' }}>Logo Seleccionado:</p>
                      <img src={customLogo} alt="Logo Preview" style={{ maxWidth: '150px', borderRadius: '8px', border: '1px solid #ccc' }} />
                      <button onClick={() => setCustomLogo(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold' }}>
                          Quitar
                      </button>
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