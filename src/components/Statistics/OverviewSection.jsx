function OverviewCard({ label, value }) {
  return (
    <article className="statistics-overview-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function OverviewSection({ overview }) {
  return (
    <section className="statistics-section">
      <h2>Overview</h2>
      <div className="statistics-overview-grid">
        <OverviewCard label="Games Played" value={overview.gamesPlayed} />
        <OverviewCard label="Average Turns" value={overview.averageTurns} />
        <OverviewCard
          label="Average Winning Score"
          value={overview.averageWinningScore}
        />
        <OverviewCard
          label="Highest Winning Score"
          value={overview.highestWinningScore}
        />
        <OverviewCard
          label="Shared Victories"
          value={overview.sharedVictories}
        />
      </div>
    </section>
  );
}

export default OverviewSection;
