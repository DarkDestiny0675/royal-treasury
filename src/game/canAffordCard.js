import { getCardPayment } from "./getCardPayment";

export function canAffordCard(player, card) {
  const payment = getCardPayment(player, card);

  return payment.canAfford;
}
