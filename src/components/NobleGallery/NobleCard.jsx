import GemBadge from "../CardSystem/GemBadge";
import "./NobleCard.css";

function NobleCard({ name, points, requirements, costs, imageKey, onClick, actionable = false }) {
  const visibleRequirements = Object.entries(requirements || costs || {}).filter(([, value]) => value > 0);
  return (
    <button
      type="button"
      className={`sovereign-card${actionable ? " sovereign-card-actionable" : ""}`}
      onClick={onClick}
      aria-label={`${name}, ${points} victory points${actionable ? ", claim noble" : ""}`}
      title={actionable ? `Claim ${name}` : `View ${name}`}
    >
      <span className="sovereign-portrait">
        <img src={`/assets/nobles/${imageKey || "noble-1"}.png`} alt="" />
        <span />
      </span>
      <span className="sovereign-frame" />
      <span className="sovereign-crest">♛</span>
      <span className="sovereign-vp" aria-label={`${points} victory points`}>
        <span className="sovereign-vp-content">
          <strong>{points}</strong>
          <small>VP</small>
        </span>
      </span>
      <span className="sovereign-nameplate"><strong>{name}</strong></span>
      <span className="sovereign-requirements">
        {visibleRequirements.map(([color, value]) => <GemBadge key={color} color={color} value={value} compact />)}
      </span>
    </button>
  );
}
export default NobleCard;
