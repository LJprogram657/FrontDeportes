'use client';

import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/admin-dashboard.css';

type Tournament = { id: number; code: string; name: string; logo: string; category?: string; };
type Team = { id: string; name: string; };
type Phase = 'round_robin' | 'groups_knockout' | 'knockout';

type Match = {
  id: string;
  phase: string;
  round?: number;
  group?: string;
  home: string;
  away: string;
  date?: string; // ISO Date
  time?: string; // HH:mm
  field?: string;
};

const predeterminedTournaments: Tournament[] = [
  { id: 1, code: 'LCG_FEM', name: 'Liga Comunal de Garzón Femenino', logo: '/images/tournaments/lcg-femenino.png' },
  { id: 2, code: 'COPA_FEM', name: 'Copa Femenina Garzón', logo: '/images/tournaments/copa-femenina.png' },
  { id: 3, code: 'LCG_FUTBOL', name: 'Liga Comunal de Garzón - Fútbol', logo: '/images/tournaments/lcg-futbol.png' },
  { id: 4, code: 'LCG_FUTBOL11', name: 'Liga Comunal de Garzón - Fútbol 11', logo: '/images/tournaments/lcg-futbol11.png' },
  { id: 5, code: 'LCG_SINTETICA', name: 'Liga Comunal de Garzón - Sintética', logo: '/images/tournaments/lcg-sintetica.png' },
];

function generateRoundRobin(teams: Team[]): Match[] {
  const list = [...teams];
  if (list.length % 2 !== 0) list.push({ id: 'BYE', name: 'DESCANSA' });

  const n = list.length;
  const half = n / 2;
  const rounds = n - 1;
  const matches: Match[] = [];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = list[i];
      const away = list[n - 1 - i];
      if (home.id !== 'BYE' && away.id !== 'BYE') {
        matches.push({
          id: `RR-${r + 1}-${i + 1}`,
          phase: 'Todos contra Todos',
          round: r + 1,
          home: home.name,
          away: away.name,
        });
      }
    }
    // rotación (método del círculo)
    const fixed = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop()!);
    list.splice(0, list.length, fixed, ...rest);
  }
  return matches;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function generateGroups(teams: Team[], groupsCount: number): Record<string, Team[]> {
  const groups: Record<string, Team[]> = {};
  for (let i = 0; i < groupsCount; i++) groups[String.fromCharCode(65 + i)] = [];
  // serpentina
  let forward = true; let index = 0;
  for (const team of teams) {
    const key = String.fromCharCode(65 + index);
    groups[key].push(team);
    if (forward) index++; else index--;
    if (index === groupsCount) { index = groupsCount - 1; forward = false; }
    if (index === -1) { index = 0; forward = true; }
  }
  return groups;
}

function rrForGroups(groups: Record<string, Team[]>): Match[] {
  const matches: Match[] = [];
  Object.entries(groups).forEach(([groupKey, teams]) => {
    const rr = generateRoundRobin(teams);
    rr.forEach((m) => { m.group = groupKey; m.phase = `Grupos (${groupKey})`; });
    matches.push(...rr);
  });
  return matches;
}

function generateKnockoutPlaceholders(groupKeys: string[], advancePerGroup: number): Match[] {
  // Crea placeholder para cuartos/semis/final dependiendo del total clasificados
  const qualifiers: string[] = [];
  groupKeys.forEach((g) => {
    for (let i = 1; i <= advancePerGroup; i++) qualifiers.push(`${g}${i}`);
  });
  // Emparejamiento simple A1 vs B2, B1 vs A2, etc.
  const pairs: [string, string][] = [];
  for (let i = 0; i < qualifiers.length; i += 4) {
    if (i + 3 < qualifiers.length) {
      pairs.push([`${qualifiers[i]}`, `${qualifiers[i + 3]}`]);
      pairs.push([`${qualifiers[i + 1]}`, `${qualifiers[i + 2]}`]);
    }
  }

  const qf: Match[] = pairs.map((p, idx) => ({
    id: `QF-${idx + 1}`,
    phase: 'Cuartos de final',
    home: `1º ${p[0][0]} (${p[0]})`,
    away: `2º ${p[1][0]} (${p[1]})`,
  }));

  const sf: Match[] = [
    { id: 'SF-1', phase: 'Semifinales', home: 'Ganador QF-1', away: 'Ganador QF-2' },
    { id: 'SF-2', phase: 'Semifinales', home: 'Ganador QF-3', away: 'Ganador QF-4' },
  ];

  const final: Match[] = [
    { id: 'F-1', phase: 'Final', home: 'Ganador SF-1', away: 'Ganador SF-2' },
  ];

  return [...qf, ...sf, ...final];
}

function assignTimeslots(matches: Match[], params: {
  startDate: string; startTime: string; matchMinutes: number; breakMinutes: number;
  fields: string[]; daysOfWeek: number[]; // 0-6 (Dom-Sáb)
}): Match[] {
  const out: Match[] = [];
  let date = new Date(`${params.startDate}T${params.startTime}:00`);
  let fieldIndex = 0;

  const isAllowedDay = (d: Date) => params.daysOfWeek.includes(d.getDay());

  for (const m of matches) {
    while (!isAllowedDay(date)) {
      date.setDate(date.getDate() + 1);
      date.setHours(Number(params.startTime.split(':')[0]));
      date.setMinutes(Number(params.startTime.split(':')[1]));
    }
    const field = params.fields[fieldIndex % params.fields.length];
    out.push({
      ...m,
      date: date.toISOString().slice(0, 10),
      time: date.toTimeString().slice(0, 5),
      field,
    });
    // siguiente timeslot
    date = new Date(date.getTime() + (params.matchMinutes + params.breakMinutes) * 60000);
    fieldIndex++;
  }
  return out;
}

const SchedulingPage: React.FC = () => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('round_robin');
  const [teams, setTeams] = useState<Team[]>([]);
  const [useApprovedFromRegistrations, setUseApprovedFromRegistrations] = useState(true);

  // parámetros de horario
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>('18:00');
  const [matchMinutes, setMatchMinutes] = useState<number>(50);
  const [breakMinutes, setBreakMinutes] = useState<number>(10);
  const [fieldsText, setFieldsText] = useState<string>('Cancha 1, Cancha 2');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]); // L, M, V

  // Cargar equipos aprobados desde localStorage + demo
  const availableTeams = useMemo(() => {
    try {
      const local = JSON.parse(localStorage.getItem('team_registrations') || '[]');
      const tournament = predeterminedTournaments.find(t => t.id === selectedTournamentId);
      const byTournament = (local as any[])
        .filter(r => r.tournament?.id === tournament?.id)
        .filter(r => r.status === 'approved' || r.status === 'pending') // ajustar si quieres solo aprobados
        .map((r: any) => ({ id: String(r.id), name: r.teamName }));
      return byTournament;
    } catch { return []; }
  }, [selectedTournamentId]);

  useEffect(() => {
    if (useApprovedFromRegistrations) {
      setTeams(availableTeams);
    }
  }, [useApprovedFromRegistrations, availableTeams]);

  const [groupsCount, setGroupsCount] = useState<number>(2);
  const [advancePerGroup, setAdvancePerGroup] = useState<number>(2);

  const [generated, setGenerated] = useState<Match[]>([]);

  const handleGenerate = () => {
    if (!selectedTournamentId) {
      alert('Selecciona un torneo');
      return;
    }
    const teamList = teams.length ? teams : [];
    if (teamList.length < 2) {
      alert('Necesitas al menos 2 equipos');
      return;
    }

    let matches: Match[] = [];
    if (phase === 'round_robin') {
      matches = generateRoundRobin(teamList);
    } else if (phase === 'groups_knockout') {
      const groups = generateGroups(teamList, groupsCount);
      const rr = rrForGroups(groups);
      const ko = generateKnockoutPlaceholders(Object.keys(groups), advancePerGroup);
      matches = [...rr, ...ko];
    } else {
      // knockout directo simple por ahora (placeholders)
      const rr = generateRoundRobin(teamList); // si hay impar, se usa BYE - puedes ajustar
      matches = rr.slice(0, Math.ceil(teamList.length / 2)); // placeholder
    }

    const assigned = assignTimeslots(matches, {
      startDate,
      startTime,
      matchMinutes,
      breakMinutes,
      fields: fieldsText.split(',').map(s => s.trim()).filter(Boolean),
      daysOfWeek,
    });

    setGenerated(assigned);
  };

  return (
    <div>
      <div className="content-header">
        <h2 className="content-title">📅 Programación de Partidos</h2>
        <p className="content-subtitle">Selecciona el torneo, equipos, formato y genera el calendario (fechas, horas y canchas)</p>
      </div>

      <div className="tournament-form-container">
        <div className="form-grid">
          <div className="form-group">
            <label>Torneo</label>
            <select value={selectedTournamentId ?? ''} onChange={(e) => setSelectedTournamentId(Number(e.target.value))}>
              <option value="">Selecciona un torneo</option>
              {predeterminedTournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Formato</label>
            <select value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
              <option value="round_robin">Todos contra Todos</option>
              <option value="groups_knockout">Fase de Grupos + Eliminatorias</option>
              <option value="knockout">Eliminatorias</option>
            </select>
          </div>

          {phase === 'groups_knockout' && (
            <>
              <div className="form-group">
                <label>Número de grupos</label>
                <input type="number" min={2} max={8} value={groupsCount} onChange={e => setGroupsCount(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Clasificados por grupo</label>
                <input type="number" min={1} max={4} value={advancePerGroup} onChange={e => setAdvancePerGroup(Number(e.target.value))} />
              </div>
            </>
          )}

          <div className="form-group full-width">
            <label>
              Equipos
              <small style={{ marginLeft: 8, color: '#666' }}>(puedes usar aprobados del registro o ingresar manualmente)</small>
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={useApprovedFromRegistrations} onChange={e => setUseApprovedFromRegistrations(e.target.checked)} />
                Usar equipos desde “Gestión de registro”
              </label>
              <button type="button" className="btn-secondary" onClick={() => setTeams(prev => [...prev, { id: String(Date.now()), name: `Equipo ${prev.length + 1}` }])}>
                + Agregar equipo
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {teams.map((t, idx) => (
                <div key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={t.name}
                    onChange={(e) => setTeams(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                    placeholder={`Nombre Equipo #${idx + 1}`}
                  />
                  <button type="button" className="btn-danger" onClick={() => setTeams(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Fecha de inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hora de inicio</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Duración partido (min)</label>
            <input type="number" min={20} value={matchMinutes} onChange={(e) => setMatchMinutes(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Descanso entre partidos (min)</label>
            <input type="number" min={0} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} />
          </div>
          <div className="form-group full-width">
            <label>Canchas (separadas por coma)</label>
            <input type="text" value={fieldsText} onChange={(e) => setFieldsText(e.target.value)} placeholder="Cancha 1, Cancha 2" />
          </div>
          <div className="form-group full-width">
            <label>Días de juego</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d, idx) => (
                <label key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={daysOfWeek.includes(idx)}
                    onChange={() =>
                      setDaysOfWeek(prev => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx])
                    }
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={handleGenerate}>Generar Calendario</button>
        </div>
      </div>

      {generated.length > 0 && (
        <div className="update-container" style={{ marginTop: 20 }}>
          <h3>Calendario generado</h3>
          <div className="tournaments-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="tournament-card">
              <table style="width:100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Fase</th>
                    <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Ronda/Grupo</th>
                    <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Local</th>
                    <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Visita</th>
                    <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Fecha</th>
                    <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Hora</th>
                    <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Cancha</th>
                  </tr>
                </thead>
                <tbody>
                  {generated.map(m => (
                    <tr key={m.id}>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">{m.phase}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">{m.group ? `Grupo ${m.group}` : (m.round ? `Ronda ${m.round}` : '-')}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">{m.home}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">{m.away}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">{m.date || '-'}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">{m.time || '-'}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">{m.field || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingPage;