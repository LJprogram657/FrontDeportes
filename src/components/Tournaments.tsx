'use client';

import { useEffect, useState, useMemo } from 'react';
// import '../styles/tournaments.css'; // Eliminamos importación de CSS

interface Tournament {
  id: number;
  name: string;
  logo: string;
  category: 'masculino' | 'femenino';
  modality: 'futsal' | 'futbol7';
  status: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
  category: 'masculino' | 'femenino';
  modality: 'futsal' | 'futbol7';
  status: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface Match {
  id: string;
  phase: string;
  homeTeam: any;
  awayTeam: any;
  date?: string;
  time?: string;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'finished';
}

interface Standing {
  id: number;
  team: { name: string; logo?: string | null };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

// Cálculo de tabla de posiciones (misma lógica que en las páginas por categoría)
function computeStandings(matches: Match[]): Standing[] {
  const teams = new Map<string, { name: string; logo?: string | null }>();
  const stats = new Map<string, {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    logo?: string | null;
  }>();

  for (const m of matches) {
    const homeName = m.homeTeam?.name;
    const awayName = m.awayTeam?.name;
    const homeLogo = m.homeTeam?.logo ?? null;
    const awayLogo = m.awayTeam?.logo ?? null;

    if (homeName) {
      teams.set(homeName, { name: homeName, logo: homeLogo });
      if (!stats.has(homeName)) {
        stats.set(homeName, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, logo: homeLogo });
      }
    }
    if (awayName) {
      teams.set(awayName, { name: awayName, logo: awayLogo });
      if (!stats.has(awayName)) {
        stats.set(awayName, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, logo: awayLogo });
      }
    }

    if (m.status === 'finished' && typeof m.homeScore === 'number' && typeof m.awayScore === 'number') {
      if (homeName) {
        const s = stats.get(homeName)!;
        s.played += 1;
        s.goalsFor += m.homeScore;
        s.goalsAgainst += m.awayScore;
        if (m.homeScore > m.awayScore) { s.wins += 1; s.points += 3; }
        else if (m.homeScore === m.awayScore) { s.draws += 1; s.points += 1; }
        else { s.losses += 1; }
      }
      if (awayName) {
        const s = stats.get(awayName)!;
        s.played += 1;
        s.goalsFor += m.awayScore;
        s.goalsAgainst += m.homeScore;
        if (m.awayScore > m.homeScore) { s.wins += 1; s.points += 3; }
        else if (m.awayScore === m.homeScore) { s.draws += 1; s.points += 1; }
        else { s.losses += 1; }
      }
    }
  }

  const table = Array.from(teams.values()).map((t, idx) => {
    const s = stats.get(t.name)!;
    const goalDiff = s.goalsFor - s.goalsAgainst;
    return {
      id: idx + 1,
      team: { name: t.name, logo: s.logo },
      played: s.played,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDiff,
      points: s.points,
    } as Standing;
  });

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  return table;
}

// Función auxiliar para obtener fases únicas y ordenadas
const getAvailablePhases = (matches: Match[]) => {
  const phases = Array.from(new Set(matches.map(m => m.phase).filter(Boolean)));
  // Orden personalizado si es necesario, o alfabético
  const phaseOrder = ['Todos contra todos', 'Fase Regular', 'Fase de Grupos', 'Octavos de Final', 'Cuartos de Final', 'Semifinales', 'Gran Final'];
  return phases.sort((a, b) => {
    const idxA = phaseOrder.indexOf(a);
    const idxB = phaseOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};

const Tournaments: React.FC = () => {
  // Estado por categoría
  const [masculineTournaments, setMasculineTournaments] = useState<Tournament[]>([]);
  const [feminineTournaments, setFeminineTournaments] = useState<Tournament[]>([]);
  const [masculineMatches, setMasculineMatches] = useState<Match[]>([]);
  const [feminineMatches, setFeminineMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para selección de fase
  const [masculinePhase, setMasculinePhase] = useState<string>('');
  const [femininePhase, setFemininePhase] = useState<string>('');

  // Fases disponibles
  const masculinePhases = useMemo(() => getAvailablePhases(masculineMatches), [masculineMatches]);
  const femininePhases = useMemo(() => getAvailablePhases(feminineMatches), [feminineMatches]);

  // Actualizar fase seleccionada por defecto cuando cargan las fases
  useEffect(() => {
    if (masculinePhases.length > 0 && !masculinePhase) {
      setMasculinePhase(masculinePhases[0]); // Seleccionar la primera fase (ej: Grupos) por defecto
    }
  }, [masculinePhases, masculinePhase]);

  useEffect(() => {
    if (femininePhases.length > 0 && !femininePhase) {
      setFemininePhase(femininePhases[0]);
    }
  }, [femininePhases, femininePhase]);

  // Tablas de posiciones filtradas por fase
  const masculineStandings = useMemo<Standing[]>(
    () => computeStandings(masculineMatches.filter(m => !masculinePhase || m.phase === masculinePhase)),
    [masculineMatches, masculinePhase]
  );
  const feminineStandings = useMemo<Standing[]>(
    () => computeStandings(feminineMatches.filter(m => !femininePhase || m.phase === femininePhase)),
    [feminineMatches, femininePhase]
  );

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Torneos masculinos activos
        const mRes = await fetch('/api/tournaments/active?category=masculino', { cache: 'no-store' });
        const mList = mRes.ok ? await mRes.json() : [];
        const mT: Tournament[] = (Array.isArray(mList) ? mList : []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          logo: t.logo || '/images/logo.png',
          category: 'masculino',
          modality: t.modality === 'futbol7' ? 'futbol7' : 'futsal',
          status: String(t.status || 'active'),
          startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : undefined,
          endDate: t.end_date ? new Date(t.end_date).toISOString().slice(0, 10) : undefined,
          description: t.description ?? undefined,
        }));
        setMasculineTournaments(mT);

        // Partidos de todos los torneos masculinos
        const mMatches: Match[] = [];
        for (const t of mT) {
          const mmRes = await fetch(`/api/tournaments/${t.id}/matches`, { cache: 'no-store' });
          if (!mmRes.ok) continue;
          const mmList = await mmRes.json();
          const mapped: Match[] = (Array.isArray(mmList) ? mmList : []).map((m: any) => ({
            id: String(m.id),
            phase: m.phase || 'Sin Fase',
            homeTeam: m.homeTeam ? { name: m.homeTeam.name, logo: m.homeTeam.logo } : null,
            awayTeam: m.awayTeam ? { name: m.awayTeam.name, logo: m.awayTeam.logo } : null,
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
            time: m.time ?? undefined,
            venue: m.venue ?? undefined,
            homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
            awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
            status: m.status === 'finished' ? 'finished' : 'scheduled',
          }));
          mMatches.push(...mapped);
        }
        setMasculineMatches(mMatches);

        // Torneos femeninos activos
        const fRes = await fetch('/api/tournaments/active?category=femenino', { cache: 'no-store' });
        const fList = fRes.ok ? await fRes.json() : [];
        const fT: Tournament[] = (Array.isArray(fList) ? fList : []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          logo: t.logo || '/images/logo.png',
          category: 'femenino',
          modality: t.modality === 'futbol7' ? 'futbol7' : 'futsal',
          status: String(t.status || 'active'),
          startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0, 10) : undefined,
          endDate: t.end_date ? new Date(t.end_date).toISOString().slice(0, 10) : undefined,
          description: t.description ?? undefined,
        }));
        setFeminineTournaments(fT);

        // Partidos de todos los torneos femeninos
        const fMatches: Match[] = [];
        for (const t of fT) {
          const fmRes = await fetch(`/api/tournaments/${t.id}/matches`, { cache: 'no-store' });
          if (!fmRes.ok) continue;
          const fmList = await fmRes.json();
          const mapped: Match[] = (Array.isArray(fmList) ? fmList : []).map((m: any) => ({
            id: String(m.id),
            phase: m.phase || 'Sin Fase',
            homeTeam: m.homeTeam ? { name: m.homeTeam.name, logo: m.homeTeam.logo } : null,
            awayTeam: m.awayTeam ? { name: m.awayTeam.name, logo: m.awayTeam.logo } : null,
            date: m.date ? new Date(m.date).toISOString().slice(0, 10) : undefined,
            time: m.time ?? undefined,
            venue: m.venue ?? undefined,
            homeScore: typeof m.homeScore === 'number' ? m.homeScore : undefined,
            awayScore: typeof m.awayScore === 'number' ? m.awayScore : undefined,
            status: m.status === 'finished' ? 'finished' : 'scheduled',
          }));
          fMatches.push(...mapped);
        }
        setFeminineMatches(fMatches);
      } catch (err) {
        console.error('Error cargando torneos:', err);
        setMasculineTournaments([]);
        setMasculineMatches([]);
        setFeminineTournaments([]);
        setFeminineMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  // Estilo para celdas de tabla (más espacio)
  // Eliminamos cellStyle y tabStyle inline para usar clases Tailwind
  // const cellStyle: React.CSSProperties = { padding: '10px 12px' };
  // const tabStyle = ...

  return (
    <section className="py-12 bg-[#1a1a1a] min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-center text-white mb-12">
          Todos los Torneos Disponibles
        </h1>

        {/* Masculinos */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6 px-2 border-l-4 border-[#e31c25]">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Torneos Masculinos</h2>
          </div>
          
          <div className="w-full max-w-6xl mx-auto">
            {isLoading ? (
              <div className="text-center py-10 text-gray-400 animate-pulse">Cargando tabla de posiciones masculinas...</div>
            ) : masculineTournaments.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white/5 rounded-lg">No hay torneos masculinos activos.</div>
            ) : (
              <div className="bg-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden border border-white/5">
                {/* Header de la Tarjeta */}
                <div className="p-4 md:p-6 bg-gradient-to-r from-[#2a2a2a] to-[#333] border-b border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 bg-white/10 rounded-lg p-1">
                        <img
                          src={masculineTournaments[0]?.logo || '/images/logo.png'}
                          alt={masculineTournaments[0]?.name || 'Torneo'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                          {masculineTournaments[0]?.name || 'Torneo'}
                        </h3>
                        <span className="text-sm text-gray-400">Tabla de Posiciones</span>
                      </div>
                    </div>
                    
                    {/* Selector de Fases Masculino */}
                    {masculinePhases.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                        {masculinePhases.map(phase => (
                          <button
                            key={phase}
                            onClick={() => setMasculinePhase(phase)}
                            className={`px-3 py-1.5 text-sm md:px-4 md:py-2 rounded-md transition-all duration-200 font-medium ${
                              masculinePhase === phase
                                ? 'bg-[#e31c25] text-white shadow-lg scale-105'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {phase}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla Responsiva */}
                <div className="p-0">
                  {masculineStandings.length > 0 ? (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                        <thead>
                          <tr className="bg-black/20 text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-3 md:p-4 font-semibold text-center w-12">#</th>
                            <th className="p-3 md:p-4 font-semibold">Equipo</th>
                            <th className="p-3 md:p-4 font-semibold text-center">PJ</th>
                            <th className="p-3 md:p-4 font-semibold text-center">G</th>
                            <th className="p-3 md:p-4 font-semibold text-center">E</th>
                            <th className="p-3 md:p-4 font-semibold text-center">P</th>
                            <th className="p-3 md:p-4 font-semibold text-center hidden sm:table-cell">GF</th>
                            <th className="p-3 md:p-4 font-semibold text-center hidden sm:table-cell">GC</th>
                            <th className="p-3 md:p-4 font-semibold text-center hidden sm:table-cell">DG</th>
                            <th className="p-3 md:p-4 font-bold text-center text-white bg-white/5">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300 text-sm md:text-base">
                          {masculineStandings.map((s, idx) => (
                            <tr 
                              key={`m-${s.team.name}-${idx}`}
                              className="hover:bg-white/5 transition-colors duration-150"
                            >
                              <td className="p-3 md:p-4 text-center font-medium text-gray-500">{idx + 1}</td>
                              <td className="p-3 md:p-4 font-medium text-white flex items-center gap-3">
                                {s.team.logo && (
                                  <img src={s.team.logo} alt="" className="w-6 h-6 object-contain hidden xs:block" />
                                )}
                                <span className="truncate max-w-[120px] md:max-w-none">{s.team.name}</span>
                              </td>
                              <td className="p-3 md:p-4 text-center">{s.played}</td>
                              <td className="p-3 md:p-4 text-center text-green-400">{s.wins}</td>
                              <td className="p-3 md:p-4 text-center text-yellow-400">{s.draws}</td>
                              <td className="p-3 md:p-4 text-center text-red-400">{s.losses}</td>
                              <td className="p-3 md:p-4 text-center hidden sm:table-cell opacity-70">{s.goalsFor}</td>
                              <td className="p-3 md:p-4 text-center hidden sm:table-cell opacity-70">{s.goalsAgainst}</td>
                              <td className="p-3 md:p-4 text-center hidden sm:table-cell font-medium">{s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}</td>
                              <td className="p-3 md:p-4 text-center font-bold text-white text-lg bg-white/5">{s.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No hay posiciones disponibles para esta fase.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Femeninos */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6 px-2 border-l-4 border-pink-500">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Torneos Femeninos</h2>
          </div>
          
          <div className="w-full max-w-6xl mx-auto">
            {isLoading ? (
              <div className="text-center py-10 text-gray-400 animate-pulse">Cargando tabla de posiciones femeninas...</div>
            ) : feminineTournaments.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white/5 rounded-lg">No hay torneos femeninos activos.</div>
            ) : (
              <div className="bg-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden border border-white/5">
                {/* Header de la Tarjeta */}
                <div className="p-4 md:p-6 bg-gradient-to-r from-[#2a2a2a] to-[#333] border-b border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 bg-white/10 rounded-lg p-1">
                        <img
                          src={feminineTournaments[0]?.logo || '/images/logo.png'}
                          alt={feminineTournaments[0]?.name || 'Torneo'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                          {feminineTournaments[0]?.name || 'Torneo'}
                        </h3>
                        <span className="text-sm text-gray-400">Tabla de Posiciones</span>
                      </div>
                    </div>

                    {/* Selector de Fases Femenino */}
                    {femininePhases.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                        {femininePhases.map(phase => (
                          <button
                            key={phase}
                            onClick={() => setFemininePhase(phase)}
                            className={`px-3 py-1.5 text-sm md:px-4 md:py-2 rounded-md transition-all duration-200 font-medium ${
                              femininePhase === phase
                                ? 'bg-pink-600 text-white shadow-lg scale-105'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {phase}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla Responsiva */}
                <div className="p-0">
                  {feminineStandings.length > 0 ? (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                        <thead>
                          <tr className="bg-black/20 text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-3 md:p-4 font-semibold text-center w-12">#</th>
                            <th className="p-3 md:p-4 font-semibold">Equipo</th>
                            <th className="p-3 md:p-4 font-semibold text-center">PJ</th>
                            <th className="p-3 md:p-4 font-semibold text-center">G</th>
                            <th className="p-3 md:p-4 font-semibold text-center">E</th>
                            <th className="p-3 md:p-4 font-semibold text-center">P</th>
                            <th className="p-3 md:p-4 font-semibold text-center hidden sm:table-cell">GF</th>
                            <th className="p-3 md:p-4 font-semibold text-center hidden sm:table-cell">GC</th>
                            <th className="p-3 md:p-4 font-semibold text-center hidden sm:table-cell">DG</th>
                            <th className="p-3 md:p-4 font-bold text-center text-white bg-white/5">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300 text-sm md:text-base">
                          {feminineStandings.map((s, idx) => (
                            <tr 
                              key={`f-${s.team.name}-${idx}`}
                              className="hover:bg-white/5 transition-colors duration-150"
                            >
                              <td className="p-3 md:p-4 text-center font-medium text-gray-500">{idx + 1}</td>
                              <td className="p-3 md:p-4 font-medium text-white flex items-center gap-3">
                                {s.team.logo && (
                                  <img src={s.team.logo} alt="" className="w-6 h-6 object-contain hidden xs:block" />
                                )}
                                <span className="truncate max-w-[120px] md:max-w-none">{s.team.name}</span>
                              </td>
                              <td className="p-3 md:p-4 text-center">{s.played}</td>
                              <td className="p-3 md:p-4 text-center text-green-400">{s.wins}</td>
                              <td className="p-3 md:p-4 text-center text-yellow-400">{s.draws}</td>
                              <td className="p-3 md:p-4 text-center text-red-400">{s.losses}</td>
                              <td className="p-3 md:p-4 text-center hidden sm:table-cell opacity-70">{s.goalsFor}</td>
                              <td className="p-3 md:p-4 text-center hidden sm:table-cell opacity-70">{s.goalsAgainst}</td>
                              <td className="p-3 md:p-4 text-center hidden sm:table-cell font-medium">{s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}</td>
                              <td className="p-3 md:p-4 text-center font-bold text-white text-lg bg-white/5">{s.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No hay posiciones disponibles para esta fase.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tournaments;