const CARD_NAMES = {
  white: {
    1: ["Diamond Mine", "Diamond Broker", "Cutting Guild", "Crystal Workshop", "Diamond Caravan", "Polishing House", "Brilliant Cache", "Diamond Market"],
    2: ["Diamond Exchange", "Diamond Consortium", "Royal Jeweler", "Crystal Treasury", "Diamond Reserve", "Crown Cutting Hall"],
    3: ["Imperial Diamonds", "Grand Diamond Treasury", "Crown Jewel Vault", "Sovereign Diamond Reserve"],
  },
  blue: {
    1: ["Sapphire Mine", "Sapphire Merchant", "Azure Workshop", "Bluewater Caravan", "Sapphire Broker", "Azure Cache", "Sapphire Market", "Tide Jewel House"],
    2: ["Sapphire Exchange", "Azure Consortium", "Sapphire Reliquary", "Bluewater Treasury", "Sapphire Reserve", "Crown Sapphire Guild"],
    3: ["Imperial Sapphires", "Royal Sapphire Treasury", "Grand Azure Reserve", "Sovereign Sapphire Reliquary"],
  },
  green: {
    1: ["Emerald Mine", "Emerald Merchant", "Verdant Workshop", "Greenstone Caravan", "Emerald Broker", "Forest Jewel House", "Emerald Market", "Verdant Cache"],
    2: ["Emerald Exchange", "Emerald Consortium", "Verdant Treasury", "Greenstone Holdings", "Emerald Reserve", "Royal Emerald Guild"],
    3: ["Imperial Emeralds", "Grand Emerald Treasury", "Crown Verdant Reserve", "Sovereign Emerald Holdings"],
  },
  red: {
    1: ["Ruby Mine", "Ruby Merchant", "Crimson Workshop", "Scarlet Caravan", "Ruby Broker", "Ruby Market", "Crimson Cache", "Scarlet Jewel House"],
    2: ["Ruby Exchange", "Ruby Consortium", "Crimson Treasury", "Ruby Reliquary", "Ruby Reserve", "Royal Ruby Guild"],
    3: ["Imperial Rubies", "Grand Ruby Treasury", "Crown Crimson Reserve", "Sovereign Ruby Reliquary"],
  },
  black: {
    1: ["Onyx Mine", "Onyx Merchant", "Obsidian Workshop", "Darkstone Caravan", "Onyx Broker", "Onyx Market", "Shadow Jewel House", "Obsidian Cache"],
    2: ["Onyx Exchange", "Onyx Consortium", "Obsidian Treasury", "Darkstone Holdings", "Onyx Reserve", "Royal Onyx Guild"],
    3: ["Imperial Onyx", "Grand Onyx Treasury", "Crown Obsidian Reserve", "Sovereign Darkstone Holdings"],
  },
};

function hashCardId(card) {
  const source = String(card.id ?? `${card.bonusColor}-${card.tier}`);
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getThemedCardTitle(card) {
  const colorNames = CARD_NAMES[card.bonusColor] || CARD_NAMES.white;
  const tierNames = colorNames[card.tier] || colorNames[1];
  return tierNames[hashCardId(card) % tierNames.length];
}

export function themeCard(card) {
  return {
    ...card,
    title: getThemedCardTitle(card),
  };
}

function themeCards(cards = []) {
  return cards.map(themeCard);
}

export function applyThemedCardNames(game) {
  return {
    ...game,
    tier1Market: themeCards(game.tier1Market),
    tier2Market: themeCards(game.tier2Market),
    tier3Market: themeCards(game.tier3Market),
    tier1Deck: themeCards(game.tier1Deck),
    tier2Deck: themeCards(game.tier2Deck),
    tier3Deck: themeCards(game.tier3Deck),
  };
}
