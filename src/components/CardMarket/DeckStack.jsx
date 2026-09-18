function DeckStack({ cardsRemaining, count, tier }) {
  const remaining = cardsRemaining ?? count ?? 0;
  return (
    <div className={`royal-deck-stack royal-deck-tier-${tier}`} aria-label={`${remaining} cards remaining in tier ${tier}`}>
      <span className="royal-deck-layer layer-three" />
      <span className="royal-deck-layer layer-two" />
      <span className="royal-deck-front">
        <span className="royal-deck-filigree">♛</span>
        <strong>Tier {tier}</strong>
        <small>{remaining} remaining</small>
      </span>
    </div>
  );
}
export default DeckStack;
