export function getTierKeys(tier) {
  if (tier === 1) {
    return {
      marketKey: "tier1Market",
      deckKey: "tier1Deck",
    };
  }

  if (tier === 2) {
    return {
      marketKey: "tier2Market",
      deckKey: "tier2Deck",
    };
  }

  return {
    marketKey: "tier3Market",
    deckKey: "tier3Deck",
  };
}

export function refillMarket(updated, marketKey, deckKey) {
  if (updated[deckKey].length === 0) {
    return;
  }

  const replacementCard = updated[deckKey][0];
  updated[deckKey] = updated[deckKey].slice(1);
  updated[marketKey].push(replacementCard);
}
