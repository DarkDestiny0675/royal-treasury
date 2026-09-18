import { getGemTheme } from "../../game/cards/gemTheme";
import "./GemToken.css";

function GemToken({ color, count, quantity, onClick }) {
  const gem = getGemTheme(color);
  const name = gem.name || String(color);
  const value = count ?? quantity ?? 0;

  return (
    <button
      type="button"
      className={`vault-gem vault-gem-${color}`}
      onClick={onClick}
      disabled={!onClick || value <= 0}
      aria-label={`${name}: ${value} available`}
      title={`${name}: ${value} available`}
    >
      <span className="vault-gem-stone" aria-hidden="true">
        <span className="vault-gem-highlight" />
        <strong className="vault-gem-count">{value}</strong>
      </span>
    </button>
  );
}

export default GemToken;
