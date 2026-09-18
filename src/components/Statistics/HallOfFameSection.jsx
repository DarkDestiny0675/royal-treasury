function RecordCard({ title, primary, secondary }) {
  return (
    <article className="hall-of-fame-card">
      <span>{title}</span>
      <strong>{primary || "No data"}</strong>
      {secondary && <small>{secondary}</small>}
    </article>
  );
}

function playerRecord(player, field, suffix) {
  if (!player) {
    return { primary: "No data", secondary: "" };
  }

  return {
    primary: `${player[field]} ${suffix}`,
    secondary:
      `${player.name} · ${player.personalityName} · Game ${player.gameNumber}`,
  };
}

function HallOfFameSection({ records }) {
  const highestScore = playerRecord(records.highestScorePlayer, "points", "points");
  const mostNobles = playerRecord(records.mostNoblesPlayer, "nobles", "nobles");
  const mostReserved = playerRecord(
    records.mostReservedPlayer,
    "reservedCards",
    "reserved",
  );
  const mostPurchased = playerRecord(
    records.mostPurchasedPlayer,
    "purchasedCards",
    "purchased",
  );

  return (
    <section className="statistics-section">
      <h2>Hall of Fame</h2>
      <div className="hall-of-fame-grid">
        <RecordCard
          title="Fastest Game"
          primary={
            records.fastestGame
              ? `${records.fastestGame.turnCount} turns`
              : "No data"
          }
          secondary={
            records.fastestGame
              ? `Game ${records.fastestGame.gameNumber} · ${records.fastestGame.winnerNames.join(" and ")}`
              : ""
          }
        />
        <RecordCard
          title="Longest Game"
          primary={
            records.longestGame
              ? `${records.longestGame.turnCount} turns`
              : "No data"
          }
          secondary={
            records.longestGame
              ? `Game ${records.longestGame.gameNumber} · ${records.longestGame.winnerNames.join(" and ")}`
              : ""
          }
        />
        <RecordCard title="Highest Player Score" {...highestScore} />
        <RecordCard title="Most Nobles" {...mostNobles} />
        <RecordCard title="Most Reserved Cards" {...mostReserved} />
        <RecordCard title="Most Purchased Cards" {...mostPurchased} />
      </div>
    </section>
  );
}

export default HallOfFameSection;
