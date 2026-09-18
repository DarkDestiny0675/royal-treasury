function Detail({ label, value }) {
  return (
    <div className="personality-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PersonalityDetailsSection({ personality }) {
  if (!personality) {
    return null;
  }

  return (
    <section className="statistics-section">
      <h2>Personality Details</h2>
      <article
        className={`personality-details personality-border-${personality.id}`}
      >
        <h3>{personality.name}</h3>
        <div className="personality-details-grid">
          <Detail label="Appearances" value={personality.games} />
          <Detail label="Wins" value={personality.wins} />
          <Detail label="Shared Wins" value={personality.sharedWins} />
          <Detail label="Win Rate" value={`${personality.winRate}%`} />
          <Detail label="Average Score" value={personality.averageScore} />
          <Detail label="Highest Score" value={personality.highestScore} />
          <Detail
            label="Average Purchased Cards"
            value={personality.averagePurchased}
          />
          <Detail
            label="Average Reserved Cards"
            value={personality.averageReserved}
          />
          <Detail
            label="Average Nobles"
            value={personality.averageNobles}
          />
        </div>
      </article>
    </section>
  );
}

export default PersonalityDetailsSection;
