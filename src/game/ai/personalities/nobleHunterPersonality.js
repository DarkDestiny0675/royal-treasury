const nobleHunterPersonality = {
    id: "nobleHunter",
    name: "Noble Hunter",
    description: "Builds toward available nobles while maintaining a competitive scoring path.",

    cardWeights: {
        points: 11,
        tier1: 18,
        tier2: 13,
        tier3: 5,
        zeroPoint: 17,
        newDiscountColor: 13,
        usefulDiscountColor: 13,
        nobleProgress: 32,
        affordable: 17,
        missingTokenPenalty: 4,
        effectiveCostPenalty: 2
    },

    reserveRules: {
        minimumPurchasedCards: 4,
        minimumPoints: 2,
        twoPointChance: 0.18,
        reserveBias: 0.27
    },

    phaseRules: {
        earlyGameCardLimit: 5,
        lateGamePointThreshold: 11
    },

    endgameRules: {
        pointsMultiplier: 3.4,
        tier1Multiplier: 0.35,
        tier2Multiplier: 1.3,
        tier3Multiplier: 1.55,
        zeroPointMultiplier: 0.08,
        nobleProgressMultiplier: 1.4,
        affordabilityMultiplier: 1.65,
        missingTokenPenaltyMultiplier: 1.2,
        reserveBiasMultiplier: 0.4
    }
};

export default nobleHunterPersonality;
