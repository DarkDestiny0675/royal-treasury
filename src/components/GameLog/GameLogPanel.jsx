function GameLogPanel({ gameLog = [], compact = false }) {
  const entries = [...gameLog].reverse();
  return (
    <section className={`game-log-panel${compact ? " compact" : ""}`}>
      <div className="game-log-header">
        <h2>Match Timeline</h2>
        <span>{gameLog.length} Entries</span>
      </div>
      <div className="game-log-entries">
        {entries.length === 0 ? (
          <div className="game-log-empty">No game activity yet.</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="game-log-entry">
              <div className="game-log-turn">Turn {entry.turn}</div>
              <div className="game-log-player">{entry.playerName}</div>
              <div className="game-log-action">{entry.action}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
export default GameLogPanel;
