import { canAffordCard } from "../canAffordCard";
import { purchaseCard } from "../purchaseCard";
import { getTierKeys, refillMarket } from "../engine/marketHelpers";
import { addGameLogEntry } from "../gameLog";

function triggerFinalRound(updated, player) {
  if (
    player.points >= (updated.victoryTarget || 20) &&
    !updated.finalRoundTriggered
  ) {
    updated.finalRoundTriggered = true;
    updated.finalRoundStartingPlayer = updated.currentPlayer;
  }
}

function returnPaymentToBank(updated, payment) {
  for (const color in payment.spentTokens) {
    updated.bank[color] += payment.spentTokens[color];
  }
}

function completeAiAction(updated, player, message, finishTurn) {
  updated.aiThinking = false;
  updated.aiMessage = message;
  addGameLogEntry(updated, player, message);
  finishTurn(updated);
  return updated;
}

export function claimAvailableNoble(
  updated,
  currentAi,
  qualifiedNobles,
  finishTurn,
) {
  const noble = qualifiedNobles.find((qualifiedNoble) =>
    updated.availableNobles.some(
      (availableNoble) => availableNoble.id === qualifiedNoble.id,
    ),
  );

  if (!noble) {
    return null;
  }

  currentAi.nobles.push(noble);
  currentAi.points += noble.points;
  updated.availableNobles = updated.availableNobles.filter(
    (availableNoble) => availableNoble.id !== noble.id,
  );
  triggerFinalRound(updated, currentAi);

  return completeAiAction(
    updated,
    currentAi,
    `${currentAi.name} claimed ${noble.name}`,
    finishTurn,
  );
}

export function purchaseAffordableReservedCard(updated, currentAi, finishTurn) {
  const affordableCards = currentAi.reservedCards.filter((card) =>
    canAffordCard(currentAi, card),
  );

  if (affordableCards.length === 0) {
    return null;
  }

  const card = [...affordableCards].sort((cardA, cardB) => {
    if (cardB.points !== cardA.points) {
      return cardB.points - cardA.points;
    }

    const costA = Object.values(cardA.costs).reduce(
      (total, value) => total + value,
      0,
    );
    const costB = Object.values(cardB.costs).reduce(
      (total, value) => total + value,
      0,
    );

    return costA - costB;
  })[0];

  const payment = purchaseCard(currentAi, card);

  if (!payment) {
    return null;
  }

  returnPaymentToBank(updated, payment);
  currentAi.reservedCards = currentAi.reservedCards.filter(
    (reservedCard) => reservedCard.id !== card.id,
  );
  triggerFinalRound(updated, currentAi);

  return completeAiAction(
    updated,
    currentAi,
    `${currentAi.name} purchased reserved card ${card.title}`,
    finishTurn,
  );
}

export function purchaseAffordableMarketCard(
  updated,
  currentAi,
  affordableCards,
  targetCard,
  finishTurn,
) {
  if (affordableCards.length === 0) {
    return null;
  }

  const bestCard =
    affordableCards.find((card) => targetCard && card.id === targetCard.id) ||
    affordableCards[0];
  const { marketKey, deckKey } = getTierKeys(bestCard.tier);
  const marketCard = updated[marketKey].find((card) => card.id === bestCard.id);

  if (!marketCard) {
    return null;
  }

  const payment = purchaseCard(currentAi, marketCard);

  if (!payment) {
    return null;
  }

  returnPaymentToBank(updated, payment);
  updated[marketKey] = updated[marketKey].filter(
    (card) => card.id !== marketCard.id,
  );
  refillMarket(updated, marketKey, deckKey);
  triggerFinalRound(updated, currentAi);

  return completeAiAction(
    updated,
    currentAi,
    `${currentAi.name} purchased ${marketCard.title}`,
    finishTurn,
  );
}

export function reserveTargetCard(
  updated,
  currentAi,
  targetCard,
  totalAiTokens,
  finishTurn,
) {
  const shouldReserve =
    targetCard &&
    currentAi.reservedCards.length < 3 &&
    !canAffordCard(currentAi, targetCard) &&
    currentAi.purchasedCards.length >= 3 &&
    (targetCard.points >= 3 ||
      (targetCard.points >= 2 && Math.random() < 0.35));

  if (!shouldReserve) {
    return null;
  }

  const { marketKey, deckKey } = getTierKeys(targetCard.tier);
  const marketCard = updated[marketKey].find(
    (card) => card.id === targetCard.id,
  );

  if (!marketCard) {
    return null;
  }

  currentAi.reservedCards.push({
    ...marketCard,
    reservedFromTier: marketCard.tier,
  });
  updated[marketKey] = updated[marketKey].filter(
    (card) => card.id !== marketCard.id,
  );

  if (updated.bank.gold > 0 && totalAiTokens < 10) {
    updated.bank.gold -= 1;
    currentAi.tokens.gold += 1;
  }

  refillMarket(updated, marketKey, deckKey);

  return completeAiAction(
    updated,
    currentAi,
    `${currentAi.name} reserved ${marketCard.title}`,
    finishTurn,
  );
}

export function completeTokenAction(
  updated,
  currentAi,
  targetCard,
  totalAiTokens,
  aiDiscounts,
  finishTurn,
) {
  const colors = ["white", "blue", "green", "red", "black"];
  const spaces = Math.max(0, 10 - totalAiTokens);
  const neededColors = targetCard
    ? colors.filter((color) => {
        const cost = Math.max(
          0,
          (targetCard.costs[color] || 0) - aiDiscounts[color],
        );

        return currentAi.tokens[color] < cost && updated.bank[color] > 0;
      })
    : [];
  const fallbackColors = colors.filter(
    (color) => updated.bank[color] > 0 && !neededColors.includes(color),
  );
  const chosenColors = [...neededColors, ...fallbackColors].slice(
    0,
    Math.min(3, spaces),
  );

  if (chosenColors.length > 0) {
    chosenColors.forEach((color) => {
      updated.bank[color] -= 1;
      currentAi.tokens[color] += 1;
    });

    return completeAiAction(
      updated,
      currentAi,
      `${currentAi.name} collected ${chosenColors.join(", ")}`,
      finishTurn,
    );
  }

  const desiredColor = targetCard
    ? colors.find((color) => {
        const cost = Math.max(
          0,
          (targetCard.costs[color] || 0) - aiDiscounts[color],
        );

        return currentAi.tokens[color] < cost && updated.bank[color] > 0;
      })
    : null;
  const returnableColors = colors.filter(
    (color) => currentAi.tokens[color] > 0 && color !== desiredColor,
  );
  const returnColor = [...returnableColors].sort((colorA, colorB) => {
    const needA = targetCard
      ? Math.max(
          0,
          (targetCard.costs[colorA] || 0) -
            aiDiscounts[colorA] -
            currentAi.tokens[colorA],
        )
      : 0;
    const needB = targetCard
      ? Math.max(
          0,
          (targetCard.costs[colorB] || 0) -
            aiDiscounts[colorB] -
            currentAi.tokens[colorB],
        )
      : 0;

    return needA - needB;
  })[0];

  let message = `${currentAi.name} passed`;

  if (desiredColor && returnColor) {
    currentAi.tokens[returnColor] -= 1;
    updated.bank[returnColor] += 1;
    updated.bank[desiredColor] -= 1;
    currentAi.tokens[desiredColor] += 1;
    message = `${currentAi.name} exchanged ${returnColor} for ${desiredColor}`;
  } else if (returnColor) {
    currentAi.tokens[returnColor] -= 1;
    updated.bank[returnColor] += 1;
    message = `${currentAi.name} returned ${returnColor} and passed`;
  }

  return completeAiAction(updated, currentAi, message, finishTurn);
}
