import { useStoredSetting } from "../../settings/settingsStore";
import "./PlayerDashboard.css";

const TOKEN_COLORS = [
  { key: "white", label: "Diamond" },
  { key: "blue", label: "Sapphire" },
  { key: "green", label: "Emerald" },
  { key: "red", label: "Ruby" },
  { key: "black", label: "Onyx" },
  { key: "gold", label: "Gold" },
];

function PlayerDashboard({
  player,
  playerIndex = 0,
  victoryTarget = 20,
  isActive,
  selectedTokens = [],
  onReturnGem,
  onViewCollection,
}) {
  const [showPersonalities] = useStoredSetting("showPersonalities", true);
  const progress = Math.min(
    100,
    ((player.points || 0) / victoryTarget) * 100,
  );
  const isHumanPlayer = player.type === "human";
  const personalityName =
    typeof player.personality === "object" ? player.personality?.name : null;
  const identityLabel = isHumanPlayer
    ? "Human"
    : showPersonalities
      ? personalityName || "AI Player"
      : "AI Player";
  const selectedGemCounts = selectedTokens.reduce((counts, color) => {
    counts[color] = (counts[color] || 0) + 1;
    return counts;
  }, {});
  const tokenTotal = Object.values(player.tokens || {}).reduce(
    (total, value) => total + (Number(value) || 0),
    0,
  );
  const avatarClass = `player-avatar ${isHumanPlayer ? "human-player" : "ai-player"}`;

  return (
    <article
      className={`player-dashboard${isActive ? " active-player" : ""}`}
    >
      <header className="player-dashboard-header">
        <div className={avatarClass}>{player.name?.slice(0, 1) || "P"}</div>
        <div className="player-identity">
          <span>Seat {playerIndex + 1}</span>
          <h3>{player.name}</h3>
          <p>{identityLabel}</p>
        </div>
        <div className="player-score">
          <strong>{player.points || 0}</strong>
          <span>of {victoryTarget}</span>
        </div>
      </header>

      <div
        className="victory-progress"
        aria-label={`${Math.round(progress)}% to victory`}
      >
        <div style={{ width: `${progress}%` }} />
      </div>

      <div className="player-compact-summary">
        <Stat label="Tokens" value={tokenTotal} />
        <Stat label="Reserved" value={(player.reservedCards || []).length} />
        <Stat label="Cards" value={(player.purchasedCards || []).length} />
        <Stat label="Nobles" value={(player.nobles || []).length} />
      </div>

      <div
        className="player-token-inventory"
        aria-label={`${player.name} token inventory`}
      >
        {TOKEN_COLORS.map(({ key, label }) => (
          <div
            key={key}
            className={`player-token-count player-token-${key}`}
          >
            <span>{label}</span>
            <strong>{player.tokens?.[key] || 0}</strong>
          </div>
        ))}
      </div>

      {isActive && selectedTokens.length > 0 && (
        <div
          className="selected-token-actions"
          aria-label="Pending gem selection"
        >
          <span className="selected-token-label">Selected</span>
          <div className="selected-token-gems">
            {Object.entries(selectedGemCounts).map(([color, count]) => (
              <button
                key={color}
                type="button"
                className={`selected-token-button selected-token-${color}`}
                onClick={() => onReturnGem?.(color)}
                title={`Return one selected ${color} gem`}
                aria-label={`Return one selected ${color} gem`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="view-collection-button"
        onClick={() => onViewCollection?.(player)}
      >
        View Collection
      </button>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default PlayerDashboard;
