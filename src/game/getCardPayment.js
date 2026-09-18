const gemColors = ["white", "blue", "green", "red", "black"];

export function getPermanentDiscounts(player) {
  const discounts = {
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
  };

  for (const card of player.purchasedCards) {
    if (card.bonusColor && discounts[card.bonusColor] !== undefined) {
      discounts[card.bonusColor] += 1;
    }
  }

  return discounts;
}

export function getCardPayment(player, card) {
  const discounts = getPermanentDiscounts(player);

  const spentTokens = {
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
    gold: 0,
  };

  let goldNeeded = 0;

  for (const color of gemColors) {
    const cardCost = card.costs[color] || 0;

    const permanentDiscount = discounts[color] || 0;

    const discountedCost = Math.max(0, cardCost - permanentDiscount);

    const availableTokens = player.tokens[color] || 0;

    const coloredTokensSpent = Math.min(availableTokens, discountedCost);

    const remainingCost = discountedCost - coloredTokensSpent;

    spentTokens[color] = coloredTokensSpent;

    goldNeeded += remainingCost;
  }

  spentTokens.gold = goldNeeded;

  return {
    canAfford: goldNeeded <= (player.tokens.gold || 0),

    spentTokens,

    discounts,
  };
}
