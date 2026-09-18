import { canAffordCard } from "../../game/canAffordCard";
import { getPermanentDiscounts } from "../../game/getCardPayment";

function PlayerPanel({
  player,
  playerIndex,
  currentPlayer,
  selectedTokens,
  onPurchaseReservedCard,
}) {
  console.log(player.name, player.personality);
  const discounts = getPermanentDiscounts(player);

  const isActivePlayer = currentPlayer === playerIndex;

  const panelClassName = isActivePlayer
    ? "player-panel active-player"
    : "player-panel";

  return (
    <div className={panelClassName}>
      <h3>{player.name}</h3>

      <div
        style={{
          fontSize: "12px",
          color: "#ffd700",
          fontWeight: "bold",
        }}
      >
        {player.personality?.name}
      </div>

      <p>Points: {player.points}</p>

      <p>Purchased Cards: {player.purchasedCards.length}</p>

      <p>Reserved Cards: {player.reservedCards.length}</p>

      {player.reservedCards.map((card) => {
        const affordable = isActivePlayer && canAffordCard(player, card);

        return (
          <button
            key={`reserved-${card.reservedFromTier}-${card.id}`}
            type="button"
            className={
              affordable
                ? "reserved-card-item affordable-reserved-card"
                : "reserved-card-item"
            }
            disabled={!isActivePlayer}
            onClick={() => onPurchaseReservedCard(card)}
          >
            <span>{card.title}</span>

            <span>{affordable ? "Purchase" : "Cannot Afford"}</span>
          </button>
        );
      })}

      <p>White Tokens: {player.tokens.white}</p>

      <p>White Discount: {discounts.white}</p>

      <p>Blue Tokens: {player.tokens.blue}</p>

      <p>Blue Discount: {discounts.blue}</p>

      <p>Green Tokens: {player.tokens.green}</p>

      <p>Green Discount: {discounts.green}</p>

      <p>Red Tokens: {player.tokens.red}</p>

      <p>Red Discount: {discounts.red}</p>

      <p>Black Tokens: {player.tokens.black}</p>

      <p>Black Discount: {discounts.black}</p>

      <p>Gold Tokens: {player.tokens.gold}</p>

      {isActivePlayer && (
        <p>
          Selected:{" "}
          {selectedTokens.length > 0 ? selectedTokens.join(", ") : "None"}
        </p>
      )}
    </div>
  );
}

export default PlayerPanel;
