import { getCardPayment } from "./getCardPayment";

export function purchaseCard(player, card) {
  const payment = getCardPayment(player, card);

  if (!payment.canAfford) {
    return null;
  }

  for (const color in payment.spentTokens) {
    player.tokens[color] -= payment.spentTokens[color];
  }

  player.purchasedCards.push(card);

  player.points += card.points;

  return payment;
}
