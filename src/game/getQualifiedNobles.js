import nobles from "../data/nobles";
import { getPermanentDiscounts } from "./getCardPayment";

export function getQualifiedNobles(player, noblePool = nobles) {
  const discounts = getPermanentDiscounts(player);

  return noblePool.filter((noble) => {
    if (player.nobles.some((ownedNoble) => ownedNoble.id === noble.id)) {
      return false;
    }

    for (const color in noble.requirements) {
      if ((discounts[color] || 0) < noble.requirements[color]) {
        return false;
      }
    }

    return true;
  });
}
