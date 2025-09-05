'use client';

import React, { useState } from 'react';
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

const CreateTournamentPage: React.FC = () => {
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  // Este estado guardará el logo como una cadena Base64
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState<'masculino' | 'femenino'>('masculino');
  const [customModality, setCustomModality] = useState<'futsal' | 'futbol7'>('futsal');
  
  const router = useRouter();

  const predeterminedTournaments: PredeterminedTournament[] = [
    // Femenino - Fútbol de Salón (4)
    {
      code: 'FEM_FUTSAL_1',
      name: 'Copa Femenina de Salón - Apertura',
      logo: '/images/femenino-futsal-1.png',
      category: 'femenino',
      modality: 'futsal',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo femenino de futsal (apertura)'
    },
    {
      code: 'FEM_FUTSAL_2',
      name: 'Copa Femenina de Salón - Clausura',
      logo: '/images/femenino-futsal-2.png',
      category: 'femenino',
      modality: 'futsal',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo femenino de futsal (clausura)'
    },
    {
      code: 'FEM_FUTSAL_3',
      name: 'Liga Femenina de Salón - Regional',
      logo: '/images/femenino-futsal-3.png',
      category: 'femenino',
      modality: 'futsal',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Liga regional femenina de futsal'
    },
    {
      code: 'FEM_FUTSAL_4',
      name: 'Relámpago Femenino de Salón',
      logo: '/images/femenino-futsal-4.png',
      category: 'femenino',
      modality: 'futsal',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo relámpago femenino de futsal'
    },

    // Femenino - Fútbol 7 (4)
    {
      code: 'FEM_F7_1',
      name: 'Copa Femenina Fútbol 7 - Apertura',
      logo: '/images/femenino-f7-1.png',
      category: 'femenino',
      modality: 'futbol7',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo femenino de fútbol 7 (apertura)'
    },
    {
      code: 'FEM_F7_2',
      name: 'Copa Femenina Fútbol 7 - Clausura',
      logo: '/images/femenino-f7-2.png',
      category: 'femenino',
      modality: 'futbol7',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo femenino de fútbol 7 (clausura)'
    },
    {
      code: 'FEM_F7_3',
      name: 'Liga Femenina Fútbol 7 - Regional',
      logo: '/images/femenino-f7-3.png',
      category: 'femenino',
      modality: 'futbol7',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Liga regional femenina de fútbol 7'
    },
    {
      code: 'FEM_F7_4',
      name: 'Relámpago Femenino Fútbol 7',
      logo: '/images/femenino-f7-4.png',
      category: 'femenino',
      modality: 'futbol7',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo relámpago femenino de fútbol 7'
    },

    // Masculino - Fútbol 7 (2)
    {
      code: 'MAS_F7_1',
      name: 'Copa Masculina Fútbol 7',
      logo: '/images/masculino-f7-1.png',
      category: 'masculino',
      modality: 'futbol7',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo masculino de fútbol 7'
    },
    {
      code: 'MAS_F7_2',
      name: 'Liga Masculina Fútbol 7',
      logo: '/images/masculino-f7-2.png',
      category: 'masculino',
      modality: 'futbol7',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Liga masculina de fútbol 7'
    },

    // Masculino - Fútbol de Salón (1)
    {
      code: 'MAS_FUTSAL_1',
      name: 'Copa Masculina de Salón',
      logo: '/images/masculino-futsal-1.png',
      category: 'masculino',
      modality: 'futsal',
      availableFormats: ['todos-contra-todos', 'fase-grupos-eliminatorias'],
      description: 'Torneo masculino de futsal'
    }
  ];

  const createAndRedirect = (base: { name: string; logo?: string | null; category: 'femenino' | 'masculino'; modality: 'futsal' | 'futbol7'; description?: string }) => {
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
      logo: base.logo || `/images/${base.category}-${base.modality}.png`,
      origin: 'created' as const,
      phases: ['round_robin']
    };

    const key = 'admin_created_tournaments';
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(newTournament);
      localStorage.setItem(key, JSON.stringify(list));
      router.push('/admin/tournaments/update');
    } catch (error) {
      console.error("Error saving to localStorage", error);
      alert("No se pudo crear el torneo.");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // El resultado es una cadena Base64 que se puede usar en `src` de <img>
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

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">🏆 Creación de Torneos</h2>
        <p className="content-subtitle">Selecciona y configura un torneo predeterminado o crea uno personalizado</p>
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
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
                {customLogo && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <p>Vista previa:</p>
                    <img src={customLogo} alt="Vista previa del logo" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '50%', border: '2px solid #ddd' }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="customCategory" style={{ fontWeight: 'bold' }}>Género</label>
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
                <label htmlFor="customModality" style={{ fontWeight: 'bold' }}>Tipo de Torneo</label>
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
                  Crear y Ajustar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="tournament-selection">
            <h3>Selecciona un tipo de torneo:</h3>
            <div className="tournaments-grid" style={{ marginBottom: '1rem' }}>
              <div className="tournament-option" onClick={() => setIsCreatingCustom(true)} style={{ cursor: 'pointer' }}>
                <div className="tournament-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>
                  ➕
                </div>
                <div className="tournament-info">
                  <h5>Crear Torneo Personalizado</h5>
                  <p className="tournament-description">Define nombre, logo, género, modalidad y cupos</p>
                </div>
                <button className="btn-primary" onClick={() => setIsCreatingCustom(true)}>
                  Crear y Ajustar
                </button>
              </div>
            </div>

            {/* FEMENINO */}
            <div className="category-section">
              <h4>🌸 Torneos Femeninos</h4>
              <h5 className="modality-subtitle">Fútbol de Salón (Futsal)</h5>
              <div className="tournaments-grid">
                {predeterminedTournaments
                  .filter(t => t.category === 'femenino' && t.modality === 'futsal')
                  .map(tournament => (
                    <div key={tournament.code} className="tournament-option">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h5>{tournament.name}</h5>
                        <p className="tournament-description">{tournament.description}</p>
                      </div>
                      <button className="btn-primary" onClick={() => createAndRedirect(tournament)}>
                        Crear y Ajustar
                      </button>
                    </div>
                  ))}
              </div>
              <h5 className="modality-subtitle">Fútbol 7</h5>
              <div className="tournaments-grid">
                {predeterminedTournaments
                  .filter(t => t.category === 'femenino' && t.modality === 'futbol7')
                  .map(tournament => (
                    <div key={tournament.code} className="tournament-option">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h5>{tournament.name}</h5>
                        <p className="tournament-description">{tournament.description}</p>
                      </div>
                      <button className="btn-primary" onClick={() => createAndRedirect(tournament)}>
                        Crear y Ajustar
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* MASCULINO */}
            <div className="category-section">
              <h4>⚽ Torneos Masculinos</h4>
              <h5 className="modality-subtitle">Fútbol de Salón (Futsal)</h5>
              <div className="tournaments-grid">
                {predeterminedTournaments
                  .filter(t => t.category === 'masculino' && t.modality === 'futsal')
                  .map(tournament => (
                    <div key={tournament.code} className="tournament-option">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h5>{tournament.name}</h5>
                        <p className="tournament-description">{tournament.description}</p>
                      </div>
                      <button className="btn-primary" onClick={() => createAndRedirect(tournament)}>
                        Crear y Ajustar
                      </button>
                    </div>
                  ))}
              </div>
              <h5 className="modality-subtitle">Fútbol 7</h5>
              <div className="tournaments-grid">
                {predeterminedTournaments
                  .filter(t => t.category === 'masculino' && t.modality === 'futbol7')
                  .map(tournament => (
                    <div key={tournament.code} className="tournament-option">
                      <div className="tournament-logo">
                        <img src={tournament.logo} alt={tournament.name} />
                      </div>
                      <div className="tournament-info">
                        <h5>{tournament.name}</h5>
                        <p className="tournament-description">{tournament.description}</p>
                      </div>
                      <button className="btn-primary" onClick={() => createAndRedirect(tournament)}>
                        Crear y Ajustar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTournamentPage;