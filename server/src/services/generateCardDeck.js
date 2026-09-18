const GEM_COLORS = ["white", "blue", "green", "red", "black"];

const CARD_COUNTS = {
  1: 40,
  2: 30,
  3: 20,
};

const CARD_TITLES = {
  1: [
    "Amber Workshop",
    "Azure Caravan",
    "Crystal Exchange",
    "Emerald Outpost",
    "Gilded Foundry",
    "Ivory Bazaar",
    "Jade Atelier",
    "Moonstone Market",
    "Onyx Workshop",
    "Opal Trading Post",
    "Pearl Merchant",
    "Ruby Smithy",
    "Sapphire Depot",
    "Silver Quarry",
    "Sunstone Guild",
    "Topaz Caravan",
    "Velvet Exchange",
    "Verdant Mine",
    "Whitewood Market",
    "Obsidian Forge",
  ],

  2: [
    "Arcane Treasury",
    "Celestial Bank",
    "Crimson Embassy",
    "Crown Exchange",
    "Diamond Consortium",
    "Emerald Citadel",
    "Golden Archive",
    "Grand Bazaar",
    "Imperial Foundry",
    "Jade Pavilion",
    "Moonlit Harbor",
    "Onyx Guildhall",
    "Opal Estate",
    "Royal Mint",
    "Ruby Conservatory",
    "Sapphire Keep",
    "Silver Embassy",
    "Starlight Gallery",
    "Verdant Palace",
    "Winter Treasury",
  ],

  3: [
    "Astral Cathedral",
    "Celestial Citadel",
    "Crown of Embers",
    "Diamond Throne",
    "Emerald Dominion",
    "Eternal Treasury",
    "Gilded Monastery",
    "Imperial Sanctuary",
    "Jade Dynasty",
    "Moonstone Palace",
    "Obsidian Crown",
    "Opal Stronghold",
    "Ruby Dominion",
    "Sapphire Cathedral",
    "Silver Citadel",
    "Sunfire Palace",
    "The Grand Vault",
    "The Royal Treasury",
    "Verdant Throne",
    "Winter Dominion",
  ],
};

const TIER_SETTINGS = {
  1: {
    pointWeights: [
      { value: 0, weight: 75 },
      { value: 1, weight: 25 },
    ],

    totalCostByPoints: {
      0: {
        minimum: 3,
        maximum: 5,
      },

      1: {
        minimum: 4,
        maximum: 6,
      },
    },

    minimumColors: 2,
    maximumColors: 4,
    maximumSingleColorCost: 4,
  },

  2: {
    pointWeights: [
      { value: 0, weight: 10 },
      { value: 1, weight: 30 },
      { value: 2, weight: 40 },
      { value: 3, weight: 20 },
    ],

    totalCostByPoints: {
      0: {
        minimum: 5,
        maximum: 6,
      },

      1: {
        minimum: 5,
        maximum: 7,
      },

      2: {
        minimum: 6,
        maximum: 8,
      },

      3: {
        minimum: 7,
        maximum: 8,
      },
    },

    minimumColors: 2,
    maximumColors: 4,
    maximumSingleColorCost: 6,
  },

  3: {
    pointWeights: [
      { value: 0, weight: 5 },
      { value: 1, weight: 10 },
      { value: 2, weight: 20 },
      { value: 3, weight: 30 },
      { value: 4, weight: 35 },
    ],

    totalCostByPoints: {
      0: {
        minimum: 7,
        maximum: 9,
      },

      1: {
        minimum: 8,
        maximum: 10,
      },

      2: {
        minimum: 9,
        maximum: 11,
      },

      3: {
        minimum: 10,
        maximum: 13,
      },

      4: {
        minimum: 12,
        maximum: 14,
      },
    },

    minimumColors: 2,
    maximumColors: 4,
    maximumSingleColorCost: 7,
  },
};

function getRandomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function shuffleValues(values) {
  const shuffledValues = [...values];

  for (let index = shuffledValues.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    const temporaryValue = shuffledValues[index];

    shuffledValues[index] = shuffledValues[randomIndex];

    shuffledValues[randomIndex] = temporaryValue;
  }

  return shuffledValues;
}

function chooseWeightedValue(weightedValues) {
  const totalWeight = weightedValues.reduce(
    (total, item) => total + item.weight,
    0,
  );

  let randomWeight = Math.random() * totalWeight;

  for (const item of weightedValues) {
    randomWeight -= item.weight;

    if (randomWeight <= 0) {
      return item.value;
    }
  }

  return weightedValues[weightedValues.length - 1].value;
}

function chooseCostColors(bonusColor, numberOfColors) {
  const availableColors = GEM_COLORS.filter((color) => color !== bonusColor);

  return shuffleValues(availableColors).slice(0, numberOfColors);
}

function distributeCost(selectedColors, totalCost, maximumSingleColorCost) {
  const costs = {};

  for (const color of selectedColors) {
    costs[color] = 1;
  }

  let remainingCost = totalCost - selectedColors.length;

  while (remainingCost > 0) {
    const eligibleColors = selectedColors.filter(
      (color) => costs[color] < maximumSingleColorCost,
    );

    if (eligibleColors.length === 0) {
      break;
    }

    const selectedColor =
      eligibleColors[getRandomInteger(0, eligibleColors.length - 1)];

    costs[selectedColor] += 1;
    remainingCost -= 1;
  }

  return costs;
}

function createBonusColorPool(cardCount) {
  const bonusColors = [];

  const cardsPerColor = cardCount / GEM_COLORS.length;

  for (const color of GEM_COLORS) {
    for (let count = 0; count < cardsPerColor; count++) {
      bonusColors.push(color);
    }
  }

  return shuffleValues(bonusColors);
}

function createCard(tier, cardNumber, bonusColor, title) {
  const settings = TIER_SETTINGS[tier];

  const points = chooseWeightedValue(settings.pointWeights);

  const costRange = settings.totalCostByPoints[points];

  const totalCost = getRandomInteger(costRange.minimum, costRange.maximum);

  const maximumPossibleColors = Math.min(
    settings.maximumColors,
    totalCost,
    GEM_COLORS.length - 1,
  );

  const numberOfColors = getRandomInteger(
    settings.minimumColors,
    maximumPossibleColors,
  );

  const selectedColors = chooseCostColors(bonusColor, numberOfColors);

  const costs = distributeCost(
    selectedColors,
    totalCost,
    settings.maximumSingleColorCost,
  );

  return {
    id: `tier-${tier}-card-${cardNumber}`,
    tier,
    title,
    points,
    bonusColor,
    costs,
  };
}

export function generateCardDeck(tier) {
  const settings = TIER_SETTINGS[tier];

  const cardCount = CARD_COUNTS[tier];

  if (!settings || !cardCount) {
    return [];
  }

  const bonusColors = createBonusColorPool(cardCount);

  const titles = shuffleValues(CARD_TITLES[tier]);

  const cards = [];

  for (let index = 0; index < cardCount; index++) {
    const baseTitle = titles[index % titles.length];

    const titleCycle = Math.floor(index / titles.length);

    const cardTitle = titleCycle === 0 ? baseTitle : `${baseTitle} II`;

    cards.push(createCard(tier, index + 1, bonusColors[index], cardTitle));
  }

  return cards;
}
