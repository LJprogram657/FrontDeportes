import React from 'react';

// Datos de ejemplo para el bracket
const bracketData = {
  quarterFinals: [
    { id: 'qf1', teams: ['Equipo A', 'Equipo B'], winner: 'Equipo A' },
    { id: 'qf2', teams: ['Equipo C', 'Equipo D'], winner: 'Equipo D' },
    { id: 'qf3', teams: ['Equipo E', 'Equipo F'], winner: 'Equipo E' },
    { id: 'qf4', teams: ['Equipo G', 'Equipo H'], winner: 'Equipo H' },
  ],
  semiFinals: [
    { id: 'sf1', teams: ['Equipo A', 'Equipo D'], winner: 'Equipo A' },
    { id: 'sf2', teams: ['Equipo E', 'Equipo H'], winner: 'Equipo H' },
  ],
  final: [
    { id: 'f1', teams: ['Equipo A', 'Equipo H'], winner: 'Equipo H' },
  ],
  champion: 'Equipo H'
};

const Bracket: React.FC = () => {
  return (
    <div className="bracket-container">
      <div className="bracket-round">
        <h3 className="bracket-round-title">Cuartos de Final</h3>
        {bracketData.quarterFinals.map(match => (
          <div key={match.id} className="bracket-match">
            <span className={match.winner === match.teams[0] ? 'winner' : ''}>{match.teams[0]}</span>
            <span className={match.winner === match.teams[1] ? 'winner' : ''}>{match.teams[1]}</span>
          </div>
        ))}
      </div>
      <div className="bracket-round">
        <h3 className="bracket-round-title">Semifinales</h3>
        {bracketData.semiFinals.map(match => (
          <div key={match.id} className="bracket-match">
            <span className={match.winner === match.teams[0] ? 'winner' : ''}>{match.teams[0]}</span>
            <span className={match.winner === match.teams[1] ? 'winner' : ''}>{match.teams[1]}</span>
          </div>
        ))}
      </div>
      <div className="bracket-round">
        <h3 className="bracket-round-title">Final</h3>
        {bracketData.final.map(match => (
          <div key={match.id} className="bracket-match">
            <span className={match.winner === match.teams[0] ? 'winner' : ''}>{match.teams[0]}</span>
            <span className={match.winner === match.teams[1] ? 'winner' : ''}>{match.teams[1]}</span>
          </div>
        ))}
      </div>
      <div className="bracket-champion">
        <h3 className="bracket-round-title">🏆 Campeón 🏆</h3>
        <div className="champion-team">{bracketData.champion}</div>
      </div>
    </div>
  );
};

export default Bracket;