export function createPersonalityRecord() {
  return {
    games: 0,
    wins: 0,
    sharedWins: 0,
    totalScore: 0,
    totalPurchasedCards: 0,
    totalReservedCards: 0,
    totalNobles: 0,
    highestScore: 0,
  };
}

export function createHumanPlayerRecord(name) {
  return {
    name,
    games: 0,
    wins: 0,
    sharedWins: 0,
    totalScore: 0,
    highestScore: 0,
    matchups: {
      humanVsHuman: { games: 0, wins: 0 },
      humanVsAi: { games: 0, wins: 0 },
      mixed: { games: 0, wins: 0 },
    },
  };
}

export function createAnalyticsState() {
  return {
    gamesPlayed: 0,
    totalTurns: 0,
    totalWinningScore: 0,
    highestWinningScore: 0,
    matchHistory: [],
    personalities: {
      builder: createPersonalityRecord(),
      nobleHunter: createPersonalityRecord(),
      investor: createPersonalityRecord(),
      finisher: createPersonalityRecord(),
    },
    humanPlayers: {},
  };
}
