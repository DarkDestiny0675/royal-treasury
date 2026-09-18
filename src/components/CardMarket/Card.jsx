import GemBadge from "../CardSystem/GemBadge";
import { getCardArtwork, getGemTheme } from "../../game/cards/gemTheme";
import "./Card.css";

function Card({
  title,
  points,
  bonusColor,
  costs = {},
  tier = 1,
  onClick,
}) {
  const bonus = getGemTheme(bonusColor);
  const bonusName = bonus.name || String(bonusColor);
  const visibleCosts = Object.entries(costs).filter(([, value]) => value > 0);
  const tierMark = tier === 1 ? "I" : tier === 2 ? "II" : "III";

  return (
    <button
      type="button"
      className={`premium-development-card premium-tier-${tier} premium-family-${bonusColor}`}
      onClick={onClick}
      aria-label={`${title}, ${points} points, ${bonusName} bonus`}
    >
      <span className="premium-card-artwork">
        <img
          src={getCardArtwork(bonusColor, tier)}
          alt=""
          draggable="false"
        />
        <span className="premium-card-vignette" />
      </span>
      <span className="premium-card-frame" aria-hidden="true" />
      <span className="premium-point-medallion">
        <strong>{points}</strong>
      </span>
      <span
        className={`premium-bonus-stone gem-stone-${bonusColor}`}
        title={`${bonusName} permanent bonus`}
        aria-label={`${bonusName} permanent bonus`}
      >
        <span />
      </span>
      <span className="premium-tier-mark">{tierMark}</span>
      <span className="premium-card-nameplate">
        <strong>{title}</strong>
      </span>
      <span className="premium-card-costs">
        {visibleCosts.length === 0 ? (
          <span className="premium-free-card">No Cost</span>
        ) : (
          visibleCosts.map(([color, value]) => (
            <GemBadge
              key={color}
              color={color}
              value={value}
              compact
            />
          ))
        )}
      </span>
    </button>
  );
}

export default Card;
