import { getAnalyticsMetrics } from "../../game/analytics/getAnalyticsMetrics";
import { getSimulationProgress } from "../../game/analytics/getSimulationProgress";

const PERSONALITY_LABELS = {
  builder: "Builder",
  nobleHunter: "Noble Hunter",
  investor: "Investor",
  finisher: "Finisher",
};

function Metric({ label, value }) {
  return (
    <div className="analytics-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SimulationControls({
  simulation,
  onRunSimulation,
  onStopSimulation,
}) {
  const progress = getSimulationProgress(simulation);

  return (
    <section className="simulation-controls">
      <div className="simulation-heading">
        <div>
          <h3>AI Simulation Lab</h3>
          <p>Run complete AI-only games at accelerated speed.</p>
        </div>

        {simulation.active && (
          <button
            type="button"
            className="simulation-stop-button"
            onClick={onStopSimulation}
          >
            Stop Simulation
          </button>
        )}
      </div>

      <div className="simulation-button-row">
        {[1, 10, 50, 100].map((gameCount) => (
          <button
            key={gameCount}
            type="button"
            disabled={simulation.active}
            onClick={() => onRunSimulation(gameCount)}
          >
            Run {gameCount} {gameCount === 1 ? "Game" : "Games"}
          </button>
        ))}
      </div>

      {simulation.active && (
        <div className="simulation-progress-area">
          <div className="simulation-progress-text">
            <span>
              Completed {simulation.completedGames} of{" "}
              {simulation.requestedGames}
            </span>
            <strong>{progress}%</strong>
          </div>

          <div className="simulation-progress-track">
            <div
              className="simulation-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function AnalyticsPanel({
  analytics,
  simulation,
  onClear,
  onRunSimulation,
  onStopSimulation,
}) {
  const metrics = getAnalyticsMetrics(analytics);

  return (
    <section className="analytics-panel">
      <div className="analytics-header">
        <div>
          <h2>AI Analytics</h2>
          <p>Persistent balance data from completed games</p>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={simulation.active}
        >
          Clear Analytics
        </button>
      </div>

      <SimulationControls
        simulation={simulation}
        onRunSimulation={onRunSimulation}
        onStopSimulation={onStopSimulation}
      />

      <div className="analytics-overview">
        <Metric label="Games Played" value={metrics.gamesPlayed} />
        <Metric label="Average Turns" value={metrics.averageTurns} />
        <Metric
          label="Average Winning Score"
          value={metrics.averageWinningScore}
        />
        <Metric
          label="Highest Winning Score"
          value={metrics.highestWinningScore}
        />
      </div>

      <div className="analytics-personality-grid">
        {metrics.personalityMetrics.map((personality) => (
          <article
            key={personality.id}
            className={
              `analytics-personality-card personality-${personality.id}`
            }
          >
            <h3>
              {PERSONALITY_LABELS[personality.id] || personality.id}
            </h3>
            <Metric label="Games" value={personality.games} />
            <Metric label="Wins" value={personality.wins} />
            <Metric label="Shared Wins" value={personality.sharedWins} />
            <Metric label="Win Rate" value={`${personality.winRate}%`} />
            <Metric label="Average Score" value={personality.averageScore} />
            <Metric
              label="Average Purchased"
              value={personality.averagePurchasedCards}
            />
            <Metric
              label="Average Reserved"
              value={personality.averageReservedCards}
            />
            <Metric
              label="Average Nobles"
              value={personality.averageNobles}
            />
            <Metric label="Highest Score" value={personality.highestScore} />
          </article>
        ))}
      </div>

      <div className="analytics-history">
        <h3>Recent Games</h3>

        <div className="analytics-history-header">
          <span>Game</span>
          <span>Winner</span>
          <span>Personality</span>
          <span>Score</span>
          <span>Turns</span>
        </div>

        {analytics.matchHistory.length === 0 ? (
          <p>No completed games recorded yet.</p>
        ) : (
          analytics.matchHistory.slice(0, 10).map((game) => (
            <div
              key={game.gameNumber}
              className="analytics-history-row"
            >
              <span>{game.gameNumber}</span>
              <strong>{game.winnerNames.join(" and ")}</strong>
              <span>{game.winnerPersonalities.join(" and ")}</span>
              <span>{game.winningScore}</span>
              <span>{game.turnCount}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default AnalyticsPanel;
