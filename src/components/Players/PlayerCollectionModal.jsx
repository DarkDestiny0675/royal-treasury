import { useState } from "react";
import Card from "../CardMarket/Card";
import NobleCard from "../NobleGallery/NobleCard";
import "./PlayerCollectionModal.css";

const BONUS_GROUPS = [
  { key: "white", label: "Diamond" },
  { key: "blue", label: "Sapphire" },
  { key: "green", label: "Emerald" },
  { key: "red", label: "Ruby" },
  { key: "black", label: "Onyx" },
];

function PlayerCollectionModal({ player, onClose, canPurchaseReserved = false, onPurchaseReserved }) {
  const [previewItem, setPreviewItem] = useState(null);
  if (!player) return null;
  const purchasedCards = player.purchasedCards || [];
  const reservedCards = player.reservedCards || [];
  const nobles = player.nobles || [];
  const playerType = typeof player.personality === "string"
    ? player.personality
    : player.personality?.name || "Player";

  function closeCollection() {
    if (previewItem) setPreviewItem(null);
    else onClose();
  }

  function openCard(card, reserved = false) {
    setPreviewItem({ type: "card", data: card, reserved });
  }

  function purchaseReservedCard() {
    if (!previewItem?.reserved || !canPurchaseReserved || !onPurchaseReserved) return;
    onPurchaseReserved(previewItem.data);
    setPreviewItem(null);
    onClose();
  }

  return (
    <div className="collection-overlay" onClick={closeCollection}>
      <section className="collection-modal" role="dialog" aria-modal="true" aria-labelledby="collection-title" onClick={(event) => event.stopPropagation()}>
        <header className="collection-header">
          <div>
            <p>{playerType}</p>
            <h2 id="collection-title">{player.name}'s Collection</h2>
            <span>{purchasedCards.length} purchased · {reservedCards.length} reserved · {nobles.length} nobles</span>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </header>
        <div className="collection-scroll-area">
          {BONUS_GROUPS.map((group) => (
            <CollectionSection key={group.key} color={group.key} mark={group.label[0]} title={`${group.label} Bonus Cards`} description={`Permanent ${group.label.toLowerCase()} discount`} count={purchasedCards.filter((card) => card.bonusColor === group.key).length}>
              <CardGallery cards={purchasedCards.filter((card) => card.bonusColor === group.key)} emptyText={`No ${group.label.toLowerCase()} bonus cards`} onViewCard={(card) => openCard(card, false)} />
            </CollectionSection>
          ))}
          <CollectionSection mark="R" markClass="reserved-mark" title="Reserved Cards" description="Cards held for a future purchase" count={reservedCards.length}>
            <CardGallery cards={reservedCards} emptyText="No reserved cards" onViewCard={(card) => openCard(card, true)} reserved />
          </CollectionSection>
          <CollectionSection mark="N" markClass="noble-mark" title="Nobles" description="Royal patrons earned during the match" count={nobles.length}>
            {nobles.length ? (
              <div className="collection-noble-grid">
                {nobles.map((noble, index) => (
                  <div className="collection-noble-card" key={noble.id || `noble-${index}`} role="button" tabIndex={0} onClick={() => setPreviewItem({ type: "noble", data: noble })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPreviewItem({ type: "noble", data: noble }); } }} aria-label={`View ${noble.name || noble.title || "noble"}`}>
                    <NobleCard {...noble} />
                  </div>
                ))}
              </div>
            ) : <Empty text="No nobles earned" />}
          </CollectionSection>
        </div>
      </section>
      {previewItem && (
        <div className="collection-card-preview-overlay" onClick={() => setPreviewItem(null)}>
          <section className={`collection-card-preview collection-${previewItem.type}-preview`} role="dialog" aria-modal="true" aria-label={`${previewItem.data.title || previewItem.data.name || "Collection item"} preview`} onClick={(event) => event.stopPropagation()}>
            <div className="collection-card-preview-stage">
              {previewItem.type === "noble"
                ? <NobleCard {...previewItem.data} />
                : <Card title={previewItem.data.title} points={previewItem.data.points} bonusColor={previewItem.data.bonusColor} costs={previewItem.data.costs || {}} tier={previewItem.data.reservedFromTier || previewItem.data.tier || 1} />}
            </div>
            {previewItem.reserved && canPurchaseReserved && (
              <button type="button" className="collection-card-preview-purchase" onClick={purchaseReservedCard}>
                Purchase Reserved Card
              </button>
            )}
            <button type="button" className="collection-card-preview-close" onClick={() => setPreviewItem(null)}>Close</button>
          </section>
        </div>
      )}
    </div>
  );
}

function CardGallery({ cards, emptyText, onViewCard, reserved = false }) {
  if (!cards.length) return <Empty text={emptyText} />;
  return (
    <div className={reserved ? "collection-card-grid" : "collection-card-gallery"}>
      {cards.map((card, index) => (
        <div className={reserved ? "collection-full-card" : "collection-gallery-card"} key={card.id || `card-${index}`} role="button" tabIndex={0} onClick={() => onViewCard(card)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onViewCard(card); } }} aria-label={`View ${card.title}`}>
          <Card title={card.title} points={card.points} bonusColor={card.bonusColor} costs={card.costs || {}} tier={card.reservedFromTier || card.tier || 1} />
        </div>
      ))}
    </div>
  );
}
function CollectionSection({ color, mark, markClass = "", title, description, count, children }) { return <section className={color ? `collection-card-group collection-${color}` : "collection-special-section"}><div className="collection-section-heading"><div><span className={`collection-section-mark ${markClass}`.trim()}>{mark}</span><div><h3>{title}</h3><p>{description}</p></div></div><strong>{count}</strong></div>{children}</section>; }
function Empty({ text }) { return <div className="collection-empty">{text}</div>; }
export default PlayerCollectionModal;
