import { useEffect } from "react";
import Card from "../CardMarket/Card";
import "./MarketCardPreview.css";
function MarketCardPreview({
  card,
  tier,
  onClose,
  canAct = false,
  busy = false,
  onPurchase,
  onReserve,
}) {
  useEffect(() => {
    const b = document.body,
      h = document.documentElement,
      bo = b.style.overflow,
      ho = h.style.overflow;
    b.style.overflow = "hidden";
    h.style.overflow = "hidden";
    return () => {
      b.style.overflow = bo;
      h.style.overflow = ho;
    };
  }, []);
  if (!card) return null;
  return (
    <div className="market-preview-overlay">
      <section className="market-preview-modal" role="dialog" aria-modal="true">
        <div className="market-preview-card">
          <Card {...card} tier={tier} />
        </div>
        {canAct && (
          <div className="market-preview-actions">
            <button
              className="market-preview-close"
              onClick={onPurchase}
              disabled={busy}
            >
              {busy ? "Processing..." : "Purchase"}
            </button>
            <button
              className="market-preview-close"
              onClick={onReserve}
              disabled={busy}
            >
              Reserve
            </button>
          </div>
        )}
        <button className="market-preview-close" onClick={onClose} disabled={busy}>
          Close
        </button>
      </section>
    </div>
  );
}
export default MarketCardPreview;
