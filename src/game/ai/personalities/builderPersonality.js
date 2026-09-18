const builderPersonality = {
    id: "builder",
    name: "Builder",
    description: "Builds an efficient discount engine, then converts it into points earlier.",

    cardWeights: {
        points: 11,
        tier1: 24,
        tier2: 16,
        tier3: 6,
        zeroPoint: 22,
        newDiscountColor: 20,
        usefulDiscountColor: 14,
        nobleProgress: 8,
        affordable: 22,
        missingTokenPenalty: 5,
        effectiveCostPenalty: 3
    },

    reserveRules: {
        minimumPurchasedCards: 4,
        minimumPoints: 3,
        twoPointChance: 0.12,
        reserveBias: 0.22
    },

    phaseRules: {
        earlyGameCardLimit: 5,
        lateGamePointThreshold: 9
    },

    endgameRules: {
        pointsMultiplier: 5,
        tier1Multiplier: 0.12,
        tier2Multiplier: 1.55,
        tier3Multiplier: 2.1,
        zeroPointMultiplier: 0,
        affordabilityMultiplier: 2,
        missingTokenPenaltyMultiplier: 1.45,
        reserveBiasMultiplier: 0.25
    }
};

export default builderPersonality;
