const finisherPersonality = {
    id: "finisher",
    name: "Finisher",
    description: "Builds only enough foundation to pursue points and close the game quickly.",

    cardWeights: {
        points: 34,
        tier1: 5,
        tier2: 20,
        tier3: 29,
        zeroPoint: 3,
        newDiscountColor: 7,
        usefulDiscountColor: 7,
        nobleProgress: 4,
        affordable: 24,
        missingTokenPenalty: 3,
        effectiveCostPenalty: 1
    },

    reserveRules: {
        minimumPurchasedCards: 3,
        minimumPoints: 3,
        twoPointChance: 0.22,
        reserveBias: 0.32
    },

    phaseRules: {
        earlyGameCardLimit: 3,
        lateGamePointThreshold: 8
    },

    endgameRules: {
        pointsMultiplier: 2.25,
        tier1Multiplier: 0.1,
        tier2Multiplier: 1.15,
        tier3Multiplier: 1.85,
        zeroPointMultiplier: 0,
        affordabilityMultiplier: 2.1,
        missingTokenPenaltyMultiplier: 1.5,
        reserveBiasMultiplier: 0.15
    }
};

export default finisherPersonality;
