import { useState } from "react";
import Card from "../CardMarket/Card";
import DeckStack from "../CardMarket/DeckStack";
import GemToken from "../GemVault/GemToken";
import NobleCard from "../NobleGallery/NobleCard";
import PlayerCollectionModal from "../Players/PlayerCollectionModal";
import PlayerDashboard from "../Players/PlayerDashboard";
import MarketCardPreview from "./MarketCardPreview";
import GameLogPanel from "../GameLog/GameLogPanel";
import "./GameBoard.css";

function GameBoard({
  gameState,
  actions,
  currentUserId = null,
  readOnly = false,
  onLeaveMatch = null,
  leaveMatchBusy = false,
  spectatorMode = false,
  onStopSpectating = null,
}) {
  const [collectionPlayer, setCollectionPlayer] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [showGameLog, setShowGameLog] = useState(false);
  const current = gameState.players[gameState.currentPlayer];
  const selected = gameState.selectedTokens || [];
  const online = Boolean(currentUserId);
  const humanTurn =
    current?.type === "human" &&
    !gameState.gameOver &&
    !readOnly &&
    (!online || current.userId === currentUserId);
  const total = Object.values(current.tokens || {}).reduce(
    (sum, value) => sum + value,
    0,
  );
  const pendingTotal = total + selected.length;
  const exchangeComplete = Boolean(
    gameState.exchangePending && selected.length === 1 && pendingTotal <= 10,
  );
  const selectableStandardColors = [
    "white",
    "blue",
    "green",
    "red",
    "black",
  ].filter((color) => (gameState.bank?.[color] || 0) > 0);
  const selectedDistinctColors = new Set(selected);
  const noAdditionalDistinctGemAvailable =
    selected.length > 0 &&
    selectedDistinctColors.size === selected.length &&
    selectableStandardColors.every((color) =>
      selectedDistinctColors.has(color),
    );
  const standardSelectionComplete =
    (selected.length === 2 && selected[0] === selected[1]) ||
    (selected.length === 3 && selectedDistinctColors.size === 3) ||
    (!gameState.exchangePending &&
      pendingTotal === 10 &&
      selected.length > 0) ||
    (!gameState.exchangePending && noAdditionalDistinctGemAvailable);
  const overflowCorrectionComplete = Boolean(
    !gameState.mustDiscardAfterReserve &&
    !gameState.exchangePending &&
    selected.length === 0 &&
    total === 10 &&
    gameState.message?.includes("returned to the 10-token limit"),
  );
  const currentDiscounts = current.purchasedCards?.reduce(
    (totals, card) => {
      totals[card.bonusColor] = (totals[card.bonusColor] || 0) + 1;
      return totals;
    },
    { white: 0, blue: 0, green: 0, red: 0, black: 0 },
  ) || { white: 0, blue: 0, green: 0, red: 0, black: 0 };
  const canClaimNoble = (noble) =>
    humanTurn &&
    !gameState.exchangePending &&
    !gameState.mustDiscardAfterReserve &&
    Object.entries(noble.requirements || noble.costs || {}).every(
      ([color, requirement]) => (currentDiscounts[color] || 0) >= requirement,
    );

  const canConfirm =
    !gameState.mustDiscardAfterReserve &&
    pendingTotal <= 10 &&
    (exchangeComplete ||
      standardSelectionComplete ||
      overflowCorrectionComplete);

  return (
    <div className="modern-game-board">
      <section className="players-section board-zone">
        <div className="board-zone-heading player-treasury-heading">
          <div className="player-treasury-title">
            <span>Contenders</span>
            <h2>Royal Court</h2>
            <button
              type="button"
              className="treasury-log-button"
              onClick={() => setShowGameLog(true)}
            >
              View Log
            </button>
          </div>
          <div className="treasury-status-message turn">
            {gameState.message || `${current.name}'s Turn`}
          </div>
          <div className="treasury-action-buttons">
            {spectatorMode ? (
              <button
                type="button"
                className="treasury-confirm-turn treasury-leave-match"
                disabled={leaveMatchBusy}
                onClick={onStopSpectating}
              >
                {leaveMatchBusy ? "Leaving..." : "Stop Spectating"}
              </button>
            ) : (
              <>
                {onLeaveMatch && (
                  <button
                    type="button"
                    className="treasury-confirm-turn treasury-leave-match"
                    disabled={leaveMatchBusy}
                    onClick={onLeaveMatch}
                  >
                    {leaveMatchBusy ? "Leaving..." : "Leave Match"}
                  </button>
                )}
                <button
                  type="button"
                  className="treasury-confirm-turn"
                  disabled={!humanTurn || !canConfirm}
                  onClick={actions.confirmGemSelection}
                >
                  Confirm Turn
                </button>
              </>
            )}
          </div>
        </div>
        <div className="player-dashboard-grid">
          {gameState.players.map((player, index) => (
            <PlayerDashboard
              key={player.id || `${player.name}-${index}`}
              player={player}
              playerIndex={index}
              victoryTarget={gameState.victoryTarget || 20}
              isActive={index === gameState.currentPlayer}
              selectedTokens={index === gameState.currentPlayer ? selected : []}
              onReturnGem={humanTurn ? actions.returnSelectedGem : undefined}
              onViewCollection={() => setCollectionPlayer(player)}
            />
          ))}
        </div>
      </section>

      <section className="gem-vault board-zone">
        <div className="board-zone-heading">
          <div>
            <span>Royal Reserve</span>
            <h2>Gem Vault</h2>
          </div>
        </div>
        <div className="token-row">
          {["white", "blue", "green", "red", "black", "gold"].map((color) => (
            <GemToken
              key={color}
              color={color}
              count={gameState.bank?.[color] || 0}
              onClick={
                humanTurn && !gameState.mustDiscardAfterReserve
                  ? () => actions.collectGem(color)
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      {gameState.availableNobles?.length > 0 && (
        <section className="noble-gallery board-zone">
          <div className="board-zone-heading">
            <div>
              <span>Royal Court</span>
              <h2>Nobles</h2>
            </div>
          </div>
          <div className="noble-row">
            {gameState.availableNobles.map((noble) => (
              <NobleCard
                key={noble.id}
                noble={noble}
                {...noble}
                actionable={canClaimNoble(noble)}
                onClick={
                  canClaimNoble(noble)
                    ? () => actions.claimNoble(noble)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {[3, 2, 1].map((tier) => (
        <section className="card-market board-zone" key={tier}>
          <div className="board-zone-heading">
            <div>
              <span>Royal Market</span>
              <h2>Tier {tier}</h2>
              <p>{gameState[`tier${tier}Deck`].length} cards remain</p>
            </div>
          </div>
          <div className="card-row">
            <DeckStack
              tier={tier}
              count={gameState[`tier${tier}Deck`].length}
            />
            {gameState[`tier${tier}Market`].map((card) => (
              <Card
                key={card.id}
                {...card}
                tier={tier}
                onClick={() => setPreviewCard({ card, tier })}
              />
            ))}
          </div>
        </section>
      ))}

      {previewCard && (
        <MarketCardPreview
          card={previewCard.card}
          tier={previewCard.tier}
          onClose={() => setPreviewCard(null)}
          canAct={
            humanTurn &&
            !gameState.exchangePending &&
            !gameState.mustDiscardAfterReserve &&
            selected.length === 0 &&
            !previewBusy
          }
          busy={previewBusy}
          onPurchase={async () => {
            setPreviewBusy(true);
            const purchased = await actions.purchaseMarketCard(
              previewCard.card,
              previewCard.tier,
            );
            setPreviewBusy(false);
            if (purchased) setPreviewCard(null);
          }}
          onReserve={async () => {
            setPreviewBusy(true);
            const reserved = await actions.reserveMarketCard(
              previewCard.card,
              previewCard.tier,
            );
            setPreviewBusy(false);
            if (reserved) setPreviewCard(null);
          }}
        />
      )}

      {collectionPlayer && (
        <PlayerCollectionModal
          player={collectionPlayer}
          onClose={() => setCollectionPlayer(null)}
          canPurchaseReserved={Boolean(
            humanTurn &&
            collectionPlayer.id === current.id &&
            !gameState.exchangePending &&
            !gameState.mustDiscardAfterReserve,
          )}
          onPurchaseReserved={(card) => actions.purchaseReservedCard(card)}
        />
      )}
      {showGameLog && (
        <div className="game-log-overlay" onClick={() => setShowGameLog(false)}>
          <section
            className="game-log-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Game activity log"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="game-log-dialog-actions">
              <button type="button" onClick={() => setShowGameLog(false)}>
                Close Log
              </button>
            </div>
            <GameLogPanel gameLog={gameState.gameLog || []} />
          </section>
        </div>
      )}
    </div>
  );
}

export default GameBoard;
