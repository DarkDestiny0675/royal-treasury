const investorPersonality = {
    id: "investor",
    name: "Investor",
    description: "Reserves valuable cards selectively and converts those investments into points.",

    cardWeights: {
        points: 18,
        tier1: 10,
        tier2: 19,
        tier3: 21,
        zeroPoint: 8,
        newDiscountColor: 10,
        usefulDiscountColor: 10,
        nobleProgress: 6,
        affordable: 14,
        missingTokenPenalty: 2,
        effectiveCostPenalty: 1
    },

    reserveRules: {
        minimumPurchasedCards: 2,
        minimumPoints: 2,
        twoPointChance: 0.45,
        reserveBias: 0.62
    },

    phaseRules: {
        earlyGameCardLimit: 3,
        lateGamePointThreshold: 10
    },

    endgameRules: {
        pointsMultiplier: 2.8,
        tier1Multiplier: 0.18,
        tier2Multiplier: 1.2,
        tier3Multiplier: 1.6,
        zeroPointMultiplier: 0.04,
        affordabilityMultiplier: 1.75,
        missingTokenPenaltyMultiplier: 1.25,
        reserveBiasMultiplier: 0.15
    }
};

export default investorPersonality;
