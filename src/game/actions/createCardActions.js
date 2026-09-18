import { addGameLogEntry } from "../gameLog";
import { canAffordCard } from "../canAffordCard";
import { purchaseCard } from "../purchaseCard";
import { getQualifiedNobles } from "../getQualifiedNobles";
import { getTierKeys, refillMarket } from "../engine/marketHelpers";

function triggerFinalRound(updated, player) {
  if (player.points >= (updated.victoryTarget || 20) && !updated.finalRoundTriggered) {
    updated.finalRoundTriggered = true;
    updated.finalRoundStartingPlayer = updated.currentPlayer;
  }
}

export function createCardActions({ setGameState, finishTurn }) {
  function purchaseMarketCard(card, tier) {
    setGameState((current) => {
      if (current.selectedTokens.length > 0) return current;
      const currentPlayer = current.players[current.currentPlayer];
      if (!canAffordCard(currentPlayer, card)) return current;
      const updated = structuredClone(current);
      const player = updated.players[updated.currentPlayer];
      const { marketKey, deckKey } = getTierKeys(tier);
      const marketCard = updated[marketKey].find((item) => item.id === card.id);
      if (!marketCard) return current;
      const payment = purchaseCard(player, marketCard);
      if (!payment) return current;
      for (const color in payment.spentTokens) updated.bank[color] += payment.spentTokens[color];
      updated[marketKey] = updated[marketKey].filter((item) => item.id !== marketCard.id);
      refillMarket(updated, marketKey, deckKey);
      triggerFinalRound(updated, player);
      addGameLogEntry(updated, player, `${player.name} purchased ${marketCard.title || "a market card"}.`);
      finishTurn(updated);
      return updated;
    });
  }

  function reserveMarketCard(card, tier) {
    setGameState((current) => {
      if (current.selectedTokens.length > 0) return current;
      const currentPlayer = current.players[current.currentPlayer];
      if (currentPlayer.reservedCards.length >= 3) return current;
      const updated = structuredClone(current);
      const player = updated.players[updated.currentPlayer];
      const { marketKey, deckKey } = getTierKeys(tier);
      const marketCard = updated[marketKey].find((item) => item.id === card.id);
      if (!marketCard) return current;
      player.reservedCards.push({ ...marketCard, reservedFromTier: tier });
      updated[marketKey] = updated[marketKey].filter((item) => item.id !== marketCard.id);
      if (updated.bank.gold > 0) { updated.bank.gold -= 1; player.tokens.gold += 1; }
      refillMarket(updated, marketKey, deckKey);
      addGameLogEntry(updated, player, `${player.name} reserved ${marketCard.title || "a market card"}.`);
      finishTurn(updated);
      return updated;
    });
  }

  function purchaseReservedCard(reservedCard) {
    setGameState((current) => {
      const currentPlayer = current.players[current.currentPlayer];
      const target = currentPlayer.reservedCards.find((card) => card.id === reservedCard.id);
      if (!target || !canAffordCard(currentPlayer, target)) return current;
      const updated = structuredClone(current);
      const player = updated.players[updated.currentPlayer];
      const card = player.reservedCards.find((item) => item.id === reservedCard.id);
      const payment = purchaseCard(player, card);
      if (!payment) return current;
      for (const color in payment.spentTokens) updated.bank[color] += payment.spentTokens[color];
      player.reservedCards = player.reservedCards.filter((item) => item.id !== card.id);
      triggerFinalRound(updated, player);
      addGameLogEntry(updated, player, `${player.name} purchased reserved card ${card.title || "card"}.`);
      finishTurn(updated);
      return updated;
    });
  }

  function claimNoble(noble) {
    setGameState((current) => {
      const updated = structuredClone(current);
      const player = updated.players[updated.currentPlayer];
      const matching = getQualifiedNobles(player, updated.availableNobles).find((item) => item.id === noble.id);
      if (!matching) return current;
      player.nobles.push(matching);
      player.points += matching.points;
      updated.availableNobles = updated.availableNobles.filter((item) => item.id !== matching.id);
      triggerFinalRound(updated, player);
      addGameLogEntry(updated, player, `${player.name} claimed ${matching.name || "a Noble"}.`);
      return updated;
    });
  }

  return { purchaseMarketCard, reserveMarketCard, purchaseReservedCard, claimNoble };
}
