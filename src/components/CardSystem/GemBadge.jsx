import { getGemTheme } from "../../game/cards/gemTheme";
import "./CardSystem.css";

function GemBadge({ color, value, compact = false, onClick, disabled = false, title }) {
  const gem = getGemTheme(color);
  const gemName = gem.name || String(color);
  const label = title || `${value} ${gemName}`;
  const badge = (
    <span
      className={`gem-cost gem-cost-${color} ${compact ? "gem-cost-compact" : ""}`}
      title={label}
      aria-label={label}
    >
      <span className="gem-cost-stone" aria-hidden="true">
        <span className="gem-cost-shine" />
      </span>
      <strong>{value}</strong>
    </span>
  );

  if (!onClick) return badge;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      style={{
        display: "inline-flex",
        margin: 0,
        padding: 0,
        border: 0,
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {badge}
    </button>
  );
}

export default GemBadge;
