const MEDALS = ["1", "2", "3", "4"];

function LeaderboardSection({ personalities, selectedId, onSelect }) {
  return (
    <section className="statistics-section">
      <h2>AI Leaderboard</h2>
      <div className="statistics-leaderboard">
        {personalities.map((personality, index) => (
          <button
            key={personality.id}
            type="button"
            className={
              `leaderboard-row personality-border-${personality.id} ` +
              (selectedId === personality.id ? "selected-personality" : "")
            }
            onClick={() => onSelect(personality.id)}
          >
            <span className="leaderboard-rank">{MEDALS[index]}</span>
            <span className="leaderboard-name">{personality.name}</span>
            <span>{personality.wins} wins</span>
            <strong>{personality.winRate}%</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

export default LeaderboardSection;
