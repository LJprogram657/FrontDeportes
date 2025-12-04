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

export default function CreateTournamentPage() {
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState<'masculino' | 'femenino'>('masculino');
  const [customModality, setCustomModality] = useState<'futsal' | 'futbol7'>('futsal');
  const [createdTournaments, setCreatedTournaments] = useState<CreatedTournament[]>([]);
  const [availableLogos, setAvailableLogos] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTournamentForEdit, setSelectedTournamentForEdit] = useState<CreatedTournament | null>(null);
  const [editForm, setEditForm] = useState<{
    status: 'active' | 'upcoming';
    registrationDeadline: string;
    startDate: string;
  }>({ status: 'upcoming', registrationDeadline: '', startDate: '' });

  // Estados para configuración de grupos
  const [groupCount, setGroupCount] = useState<number>(1);
  const handleGroupCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupCount(Number(e.target.value));
  };

  // Declarar fases y estado del modal dentro del componente (no fuera)
  const PHASES = [
    { type: 'round_robin', label: 'Todos contra Todos' },
    { type: 'group_stage', label: 'Fase de Grupos' },
    { type: 'round_of_16', label: 'Octavos' },
    { type: 'quarterfinals', label: 'Cuartos' },
    { type: 'semifinals', label: 'Semifinal' },
    { type: 'final', label: 'Final' },
  ] as const;

  const [editPhases, setEditPhases] = useState<string[]>([]);
  const toggleEditPhase = (phaseType: string) => {
    setEditPhases(prev =>
      prev.includes(phaseType) ? prev.filter(p => p !== phaseType) : [...prev, phaseType]
    );
  };

  const authHeaders = (): Record<string, string> => {
    try {
      const token = localStorage.getItem('access_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const loadCreatedTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments', { cache: 'no-store', headers: { ...authHeaders() } });
      if (!res.ok) throw new Error('No se pudieron cargar los torneos');
      const data = await res.json();

      const mapped: CreatedTournament[] = (Array.isArray(data) ? data : []).map((t: any): CreatedTournament => ({
        id: Number(t.id),
        name: String(t.name),
        description: '',
        sport: 'futbol',
        category: (t.category === 'femenino' || t.category === 'masculino' ? t.category : 'masculino'),
        modality: (t.modality === 'futbol7' ? 'futbol7' : 'futsal'),
        startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : '',
        endDate: '',
        registrationDeadline: t.registration_deadline ? new Date(t.registration_deadline).toISOString().slice(0, 10) : '',
        maxTeams: Number(t.max_teams ?? 16),
        location: '',
        format: 'round_robin',
        prizePool: '',
        status: (t.status === 'active' || t.status === 'upcoming' ? t.status : (t.status === 'finished' ? 'completed' : 'upcoming')),
        logo: t.logo || '/images/logo.png',
        origin: 'created',
        // Precargar fases reales desde el API
        phases: Array.isArray(t.phases) ? t.phases : ['round_robin'],
      }));
      setCreatedTournaments(mapped);
      
      // Actualizar también el torneo seleccionado si está abierto el modal
      if (selectedTournamentForEdit) {
         const updated = mapped.find(t => t.id === selectedTournamentForEdit.id);
         if (updated) {
             setSelectedTournamentForEdit(updated);
             // IMPORTANTE: No sobrescribir editPhases aquí si el usuario está editando,
             // pero para advanceToNextPhase necesitamos que selectedTournamentForEdit esté fresco.
         }
      }

    } catch (error) {
      console.error('Error cargando torneos:', error);
      // No mostrar toast aquí para evitar spam en cada recarga, o usar uno discreto
    }
  };

  const advanceToNextPhase = async (tournamentId: number) => {
    try {
      // 1. Encontrar el torneo actual para ver sus fases REALES
      // Usamos createdTournaments que tiene la info fresca (o debería)
      const tournament = createdTournaments.find(t => t.id === tournamentId);
      if (!tournament) throw new Error('Torneo no encontrado');

      // 2. Orden lógico de fases
      const PHASE_ORDER = ['round_robin', 'group_stage', 'round_of_16', 'quarterfinals', 'semifinals', 'final'];
      
      // 3. Ordenar las fases seleccionadas por el usuario (editPhases)
      // editPhases tiene lo que el usuario ve seleccionado en los botones rojos
      const sortedSelectedPhases = [...editPhases].sort((a, b) => {
        return PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b);
      });

      if (sortedSelectedPhases.length === 0) {
        toast.error('Debes seleccionar al menos una fase en la configuración para avanzar');
        return;
      }

      // 4. Determinar la fase actual (la última creada)
      const currentPhases = tournament.phases || [];
      const lastCurrentPhase = currentPhases.length > 0 ? currentPhases[currentPhases.length - 1] : null;

      let nextPhaseToSend = '';

      if (!lastCurrentPhase) {
        // Si no hay fases creadas, la siguiente es la primera de las seleccionadas
        nextPhaseToSend = sortedSelectedPhases[0];
      } else {
        const currentOrderIndex = PHASE_ORDER.indexOf(lastCurrentPhase);
        
        // Buscar la primera fase seleccionada cuyo índice sea MAYOR que el de la fase actual
        const nextPhase = sortedSelectedPhases.find(p => PHASE_ORDER.indexOf(p) > currentOrderIndex);
        
        if (nextPhase) {
          nextPhaseToSend = nextPhase;
        } else {
           toast.info('Ya estás en la última fase seleccionada.');
           return;
        }
      }

      // Confirmación antes de avanzar
      const phaseLabel = PHASES.find(p => p.type === nextPhaseToSend)?.label || nextPhaseToSend;
      const confirmMsg = `¿Avanzar a la fase: ${phaseLabel}?`;
      if (!window.confirm(confirmMsg)) return;

      const res = await fetch(`/api/tournaments/${tournamentId}/advance-phase`, {
        method: 'POST',
        headers: { 
            ...authHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nextPhase: nextPhaseToSend })
      });
      
      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'No se pudo avanzar de fase');
      }
      
      toast.success(`¡Fase avanzada a ${phaseLabel}!`);
      
      // Recargar torneos para actualizar estado
      await loadCreatedTournaments();

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error al avanzar de fase');
    }
  };

  // Cargar torneos desde BD al montar
  useEffect(() => {
    loadCreatedTournaments();
  }, []);

  const createAndRedirect = async (base: { name: string; logo?: string | null; category: 'femenino' | 'masculino'; modality: 'futsal' | 'futbol7'; description?: string }) => {
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: base.name,
          category: base.category,
          logo: base.logo ?? null,
          status: 'upcoming',
          description: base.description ?? undefined,
          format: 'round_robin',
          max_teams: 16,
        }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || 'No se pudo crear el torneo');
      }
      const created = await res.json();
      setCreatedTournaments(prev => [
        ...prev,
        {
          id: Number(created.id),
          name: String(created.name),
          description: base.description || `Torneo de ${base.modality} ${base.category}`,
          sport: 'futbol',
          category: (created.category === 'femenino' || created.category === 'masculino' ? created.category : base.category),
          modality: base.modality,
          startDate: created.startDate ? new Date(created.startDate).toISOString().slice(0, 10) : '',
          endDate: '',
          registrationDeadline: created.registrationDeadline ? new Date(created.registrationDeadline).toISOString().slice(0, 10) : '',
          maxTeams: Number(created.maxTeams ?? 16),
          location: '',
          format: 'round_robin',
          prizePool: '',
          status: (created.status === 'active' || created.status === 'upcoming' || created.status === 'completed' ? created.status : 'upcoming'),
          logo: created.logo || '/images/logo.png',
          origin: 'created',
          phases: ['round_robin'],
        },
      ]);
      setCustomName('');
      setCustomLogo(null);
      setCustomCategory('masculino');
      setCustomModality('futsal');
      setIsCreatingCustom(false);
      toast.success('¡Torneo creado exitosamente!');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el torneo');
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

  // Reemplazar este método: anteriormente hacía router.push
  const editTournament = (tournamentId: number) => {
    const t = createdTournaments.find(tt => tt.id === tournamentId);
    if (!t) { toast.error('Torneo no encontrado'); return; }
    setSelectedTournamentForEdit(t);
    setEditForm({
      status: t.status === 'active' ? 'active' : 'upcoming',
      registrationDeadline: t.registrationDeadline || '',
      startDate: t.startDate || '',
    });
    setEditPhases(Array.isArray(t.phases) && t.phases.length > 0 ? t.phases : ['round_robin']);
    setIsEditModalOpen(true);
  };

  const deleteTournament = (tournamentId: number, tournamentName: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar el torneo "${tournamentName}"? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;
    (async () => {
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}`, {
          method: 'DELETE',
          headers: { ...authHeaders() },
        });
        if (!res.ok) throw new Error('No se pudo eliminar el torneo');
        setCreatedTournaments(prev => prev.filter(t => t.id !== tournamentId));
        toast.success('Torneo eliminado exitosamente');
      } catch (e) {
        console.error('Error eliminando torneo:', e);
        toast.error('Error al eliminar el torneo');
      }
    })();
  };

  const handleEditChange = (field: keyof typeof editForm, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTournamentForEdit(null);
  };

  const saveTournamentConfig = () => {
    if (!selectedTournamentForEdit) return;
    (async () => {
      try {
        const res = await fetch(`/api/tournaments/${selectedTournamentForEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            status: editForm.status,
            registration_deadline: editForm.registrationDeadline || null,
            start_date: editForm.startDate || null,
            // Enviar fases para persistirlas
            phases: editPhases,
          }),
        });
        if (!res.ok) throw new Error('Error al actualizar torneo en BD');
        const updated = await res.json();

        setCreatedTournaments(prev => prev.map(t =>
          t.id === selectedTournamentForEdit.id
            ? {
                ...t,
                status: updated.status,
                registrationDeadline: updated.registrationDeadline ? new Date(updated.registrationDeadline).toISOString().slice(0, 10) : '',
                startDate: updated.startDate ? new Date(updated.startDate).toISOString().slice(0, 10) : '',
                // Actualizar fases en el estado local
                phases: editPhases.length > 0 ? editPhases : t.phases,
              }
            : t
        ));

        toast.success('Torneo actualizado');
        closeEditModal();
      } catch (e) {
        console.error(e);
        toast.error('Error al actualizar el torneo');
      }
    })();
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

      {/* Modal de edición */}
      {isEditModalOpen && selectedTournamentForEdit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ marginBottom: '16px' }}>
              Editar torneo: {selectedTournamentForEdit.name}
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontWeight: 'bold' }}>Estado</label>
                <select
                  value={editForm.status}
                  onChange={e => handleEditChange('status', e.target.value as 'active' | 'upcoming')}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                  <option value="upcoming">Próximo</option>
                  <option value="active">Activo</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold' }}>Fecha límite de inscripción</label>
                <input
                  type="date"
                  value={editForm.registrationDeadline}
                  onChange={e => handleEditChange('registrationDeadline', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold' }}>Fecha de inicio del torneo</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={e => handleEditChange('startDate', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>

              {/* Fases del torneo */}
              <div>
                <label style={{ fontWeight: 'bold' }}>Fases del torneo</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {PHASES.map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleEditPhase(type)}
                      className={`phase-chip ${editPhases.includes(type) ? 'selected' : ''}`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '20px',
                        border: editPhases.includes(type) ? '1px solid #dc3545' : '1px solid #ccc',
                        background: editPhases.includes(type) ? '#ffe5e8' : '#fff',
                        color: editPhases.includes(type) ? '#dc3545' : '#333',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      aria-pressed={editPhases.includes(type)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuración de grupos si la fase de grupos está seleccionada */}
              {editPhases.includes('group_stage') && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontWeight: 'bold' }}>Cantidad de grupos</label>
                  <input
                    type="number"
                    min={1}
                    value={groupCount}
                    onChange={handleGroupCountChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Los equipos se repartirán automáticamente entre los grupos.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                className="btn-secondary"
                onClick={closeEditModal}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={saveTournamentConfig}
                style={{ flex: 1 }}
              >
                Guardar
              </button>
              <button
                className="btn-warning"
                onClick={() => advanceToNextPhase(selectedTournamentForEdit.id)}
                style={{ flex: 1, background: '#ffc107', color: '#222', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
              >
                Siguiente fase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}