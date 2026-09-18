import { getPermanentDiscounts } from "./getCardPayment";

const GEM_COLORS = ["white", "blue", "green", "red", "black"];

const DEFAULT_WEIGHTS = {
  points: 12,
  tier1: 16,
  tier2: 10,
  tier3: 4,
  zeroPoint: 14,
  newDiscountColor: 12,
  usefulDiscountColor: 10,
  nobleProgress: 0,
  affordable: 16,
  missingTokenPenalty: 4,
  effectiveCostPenalty: 2,
};

function getWeights(player) {
  const baseWeights = {
    ...DEFAULT_WEIGHTS,
    ...(player.personality?.cardWeights || {}),
  };

  const latePointThreshold =
    player.personality?.phaseRules?.lateGamePointThreshold ?? 10;

  if (player.points < latePointThreshold) {
    return baseWeights;
  }

  const endgameRules = player.personality?.endgameRules || {};

  return {
    ...baseWeights,

    points: baseWeights.points * (endgameRules.pointsMultiplier ?? 1),

    tier1: baseWeights.tier1 * (endgameRules.tier1Multiplier ?? 1),

    tier2: baseWeights.tier2 * (endgameRules.tier2Multiplier ?? 1),

    tier3: baseWeights.tier3 * (endgameRules.tier3Multiplier ?? 1),

    zeroPoint: baseWeights.zeroPoint * (endgameRules.zeroPointMultiplier ?? 1),

    nobleProgress:
      baseWeights.nobleProgress * (endgameRules.nobleProgressMultiplier ?? 1),

    affordable:
      baseWeights.affordable * (endgameRules.affordabilityMultiplier ?? 1),

    missingTokenPenalty:
      baseWeights.missingTokenPenalty *
      (endgameRules.missingTokenPenaltyMultiplier ?? 1),
  };
}

function getEffectiveCost(player, card) {
  const discounts = getPermanentDiscounts(player);

  return GEM_COLORS.reduce((total, color) => {
    const printedCost = card.costs[color] || 0;
    const discount = discounts[color] || 0;

    return total + Math.max(0, printedCost - discount);
  }, 0);
}

function getMissingTokenCount(player, card) {
  const discounts = getPermanentDiscounts(player);

  const missingColoredTokens = GEM_COLORS.reduce((total, color) => {
    const printedCost = card.costs[color] || 0;
    const discount = discounts[color] || 0;
    const ownedTokens = player.tokens[color] || 0;

    const discountedCost = Math.max(0, printedCost - discount);

    return total + Math.max(0, discountedCost - ownedTokens);
  }, 0);

  return Math.max(0, missingColoredTokens - (player.tokens.gold || 0));
}

function getBonusColorCount(player, bonusColor) {
  return player.purchasedCards.filter((card) => card.bonusColor === bonusColor)
    .length;
}

function getTierWeight(weights, tier) {
  if (tier === 1) {
    return weights.tier1;
  }

  if (tier === 2) {
    return weights.tier2;
  }

  return weights.tier3;
}

function getNobleProgressScore(player, card, availableNobles, weights) {
  if (
    !availableNobles ||
    availableNobles.length === 0 ||
    !weights.nobleProgress
  ) {
    return 0;
  }

  const discounts = getPermanentDiscounts(player);
  const bonusColor = card.bonusColor;

  let strongestProgress = 0;

  for (const noble of availableNobles) {
    const requiredAmount = noble.requirements[bonusColor] || 0;

    if (requiredAmount === 0) {
      continue;
    }

    const currentAmount = discounts[bonusColor] || 0;
    const remainingBeforeCard = Math.max(0, requiredAmount - currentAmount);

    if (remainingBeforeCard === 0) {
      continue;
    }

    const progressRatio = 1 / remainingBeforeCard;

    strongestProgress = Math.max(
      strongestProgress,
      progressRatio * weights.nobleProgress,
    );
  }

  return strongestProgress;
}

function getPhaseMultiplier(player, card) {
  const personality = player.personality;

  if (!personality?.phaseRules) {
    return 1;
  }

  const purchasedCards = player.purchasedCards.length;
  const earlyLimit = personality.phaseRules.earlyGameCardLimit ?? 4;
  const latePointThreshold =
    personality.phaseRules.lateGamePointThreshold ?? 10;

  if (player.points >= latePointThreshold) {
    if (card.points >= 3) {
      return 1.35;
    }

    if (card.points === 0) {
      return 0.45;
    }

    return 1;
  }

  if (purchasedCards < earlyLimit) {
    if (card.tier === 1) {
      return 1.25;
    }

    if (card.tier === 3) {
      return 0.55;
    }
  }

  return 1;
}

function getCardScore(player, card, availableNobles) {
  const weights = getWeights(player);
  const effectiveCost = getEffectiveCost(player, card);
  const missingTokens = getMissingTokenCount(player, card);
  const ownedBonusCount = getBonusColorCount(player, card.bonusColor);

  const pointsScore = card.points * weights.points;
  const tierScore = getTierWeight(weights, card.tier);
  const zeroPointScore = card.points === 0 ? weights.zeroPoint : 0;
  const newColorScore = ownedBonusCount === 0 ? weights.newDiscountColor : 0;
  const usefulColorScore =
    ownedBonusCount < 3 ? weights.usefulDiscountColor : 0;
  const affordabilityScore = missingTokens === 0 ? weights.affordable : 0;
  const missingTokenPenalty = missingTokens * weights.missingTokenPenalty;
  const effectiveCostPenalty = effectiveCost * weights.effectiveCostPenalty;
  const nobleProgressScore = getNobleProgressScore(
    player,
    card,
    availableNobles,
    weights,
  );

  const baseScore =
    pointsScore +
    tierScore +
    zeroPointScore +
    newColorScore +
    usefulColorScore +
    affordabilityScore +
    nobleProgressScore -
    missingTokenPenalty -
    effectiveCostPenalty;

  return baseScore * getPhaseMultiplier(player, card);
}

function chooseWeightedCandidate(scoredCards) {
  scoredCards.sort((cardA, cardB) => cardB.score - cardA.score);

  const strongestCandidates = scoredCards.slice(
    0,
    Math.min(3, scoredCards.length),
  );

  const weights = [6, 3, 1].slice(0, strongestCandidates.length);

  const totalWeight = weights.reduce((total, weight) => total + weight, 0);

  let randomWeight = Math.random() * totalWeight;

  for (let index = 0; index < strongestCandidates.length; index++) {
    randomWeight -= weights[index];

    if (randomWeight <= 0) {
      return strongestCandidates[index].card;
    }
  }

  return strongestCandidates[0].card;
}

export function chooseAiTargetCard(player, marketCards, availableNobles = []) {
  if (!marketCards || marketCards.length === 0) {
    return null;
  }

  const scoredCards = marketCards.map((card) => ({
    card,
    score: getCardScore(player, card, availableNobles),
  }));

  return chooseWeightedCandidate(scoredCards);
}
