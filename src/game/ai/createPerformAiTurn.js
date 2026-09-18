import { chooseAiTargetCard } from "../chooseAiTargetCard";
import { canAffordCard } from "../canAffordCard";
import { getPermanentDiscounts } from "../getCardPayment";
import { getQualifiedNobles } from "../getQualifiedNobles";
import {
  claimAvailableNoble,
  completeTokenAction,
  purchaseAffordableMarketCard,
  purchaseAffordableReservedCard,
  reserveTargetCard,
} from "./aiActionHelpers";

export function createPerformAiTurn({ setGameState, finishTurn }) {
  return function performAiTurn() {
    setGameState((current) => {
      const updated = structuredClone(current);
      const currentAi = updated.players[updated.currentPlayer];

      const nobleResult = claimAvailableNoble(
        updated,
        currentAi,
        getQualifiedNobles(currentAi, updated.availableNobles),
        finishTurn,
      );

      if (nobleResult) {
        return nobleResult;
      }

      const reservedResult = purchaseAffordableReservedCard(
        updated,
        currentAi,
        finishTurn,
      );

      if (reservedResult) {
        return reservedResult;
      }

      const marketCards = [
        ...updated.tier1Market,
        ...updated.tier2Market,
        ...updated.tier3Market,
      ];
      const affordableCards = marketCards.filter((card) =>
        canAffordCard(currentAi, card),
      );
      const targetCard = chooseAiTargetCard(
        currentAi,
        marketCards,
        updated.availableNobles,
      );

      const purchaseResult = purchaseAffordableMarketCard(
        updated,
        currentAi,
        affordableCards,
        targetCard,
        finishTurn,
      );

      if (purchaseResult) {
        return purchaseResult;
      }

      const totalAiTokens = Object.values(currentAi.tokens).reduce(
        (total, tokenCount) => total + tokenCount,
        0,
      );
      const reserveResult = reserveTargetCard(
        updated,
        currentAi,
        targetCard,
        totalAiTokens,
        finishTurn,
      );

      if (reserveResult) {
        return reserveResult;
      }

      return completeTokenAction(
        updated,
        currentAi,
        targetCard,
        totalAiTokens,
        getPermanentDiscounts(currentAi),
        finishTurn,
      );
    });
  };
}
