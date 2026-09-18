export const GEM_THEME = {
  white: { name: "Diamond", asset: "diamond", symbol: "D" },
  blue: { name: "Sapphire", asset: "sapphire", symbol: "S" },
  green: { name: "Emerald", asset: "emerald", symbol: "E" },
  red: { name: "Ruby", asset: "ruby", symbol: "R" },
  black: { name: "Onyx", asset: "onyx", symbol: "O" },
  gold: { name: "Gold", asset: "gold", symbol: "G" },
};

export function getGemTheme(color) {
  return GEM_THEME[color] || {
    name: String(color),
    asset: String(color),
    symbol: String(color).slice(0, 1).toUpperCase(),
  };
}

export function getCardArtwork(bonusColor, tier = 1) {
  const gem = getGemTheme(bonusColor);
  const safeTier = Math.min(3, Math.max(1, Number(tier) || 1));
  return `/assets/cards/${gem.asset}/tier-${safeTier}.jpg`;
}
