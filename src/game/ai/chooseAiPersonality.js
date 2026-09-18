import builderPersonality from "./personalities/builderPersonality";
import finisherPersonality from "./personalities/finisherPersonality";
import investorPersonality from "./personalities/investorPersonality";
import nobleHunterPersonality from "./personalities/nobleHunterPersonality";

const AI_PERSONALITIES = [
    builderPersonality,
    nobleHunterPersonality,
    investorPersonality,
    finisherPersonality
];

export function chooseAiPersonality() {
    const randomIndex = Math.floor(
        Math.random() * AI_PERSONALITIES.length
    );

    return {
        ...AI_PERSONALITIES[randomIndex],
        cardWeights: {
            ...AI_PERSONALITIES[randomIndex].cardWeights
        },
        reserveRules: {
            ...AI_PERSONALITIES[randomIndex].reserveRules
        },
        phaseRules: {
            ...AI_PERSONALITIES[randomIndex].phaseRules
        }
    };
}

export function getAiPersonalities() {
    return AI_PERSONALITIES.map((personality) => ({
        ...personality,
        cardWeights: {
            ...personality.cardWeights
        },
        reserveRules: {
            ...personality.reserveRules
        },
        phaseRules: {
            ...personality.phaseRules
        }
    }));
}
