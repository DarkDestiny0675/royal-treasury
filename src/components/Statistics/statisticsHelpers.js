export function getMatchupLabel(value) {
  return ({
    humanVsAi: "Human vs. AI",
    humanVsHuman: "Human vs. Human",
    mixed: "Mixed Match",
  })[value] || value || "Unknown";
}

const PERSONALITY_NAMES = {
  builder: "Builder",
  nobleHunter: "Noble Hunter",
  investor: "Investor",
  finisher: "Finisher",
  unassigned: "Unassigned",
};

export function getPersonalityName(id) {
  return PERSONALITY_NAMES[id] || id;
}

function average(total, count) {
  if (!count) {
    return 0;
  }

  return Number((total / count).toFixed(2));
}

export function buildStatistics(analytics) {
  const history = analytics.matchHistory || [];
  const personalities = Object.entries(
    analytics.personalities || {},
  ).map(([id, record]) => ({
    id,
    name: getPersonalityName(id),
    games: record.games || 0,
    wins: record.wins || 0,
    sharedWins: record.sharedWins || 0,
    winRate: average((record.wins || 0) * 100, record.games || 0),
    averageScore: average(record.totalScore || 0, record.games || 0),
    averagePurchased: average(
      record.totalPurchasedCards || 0,
      record.games || 0,
    ),
    averageReserved: average(
      record.totalReservedCards || 0,
      record.games || 0,
    ),
    averageNobles: average(
      record.totalNobles || 0,
      record.games || 0,
    ),
    highestScore: record.highestScore || 0,
  }));

  const rankedPersonalities = [...personalities].sort(
    (a, b) => b.winRate - a.winRate || b.wins - a.wins,
  );

  const allPlayers = history.flatMap((game) =>
    (game.players || []).map((player) => ({
      ...player,
      gameNumber: game.gameNumber,
      turnCount: game.turnCount,
    })),
  );

  const fastestGame = history.length
    ? [...history].sort((a, b) => a.turnCount - b.turnCount)[0]
    : null;
  const longestGame = history.length
    ? [...history].sort((a, b) => b.turnCount - a.turnCount)[0]
    : null;
  const highestScorePlayer = allPlayers.length
    ? [...allPlayers].sort((a, b) => b.points - a.points)[0]
    : null;
  const mostNoblesPlayer = allPlayers.length
    ? [...allPlayers].sort((a, b) => b.nobles - a.nobles)[0]
    : null;
  const mostReservedPlayer = allPlayers.length
    ? [...allPlayers].sort(
        (a, b) => b.reservedCards - a.reservedCards,
      )[0]
    : null;
  const mostPurchasedPlayer = allPlayers.length
    ? [...allPlayers].sort(
        (a, b) => b.purchasedCards - a.purchasedCards,
      )[0]
    : null;

  return {
    overview: {
      gamesPlayed: analytics.gamesPlayed || 0,
      averageTurns: average(
        analytics.totalTurns || 0,
        analytics.gamesPlayed || 0,
      ),
      averageWinningScore: average(
        analytics.totalWinningScore || 0,
        analytics.gamesPlayed || 0,
      ),
      highestWinningScore: analytics.highestWinningScore || 0,
      sharedVictories: personalities.reduce(
        (total, personality) => total + personality.sharedWins,
        0,
      ),
    },
    personalities,
    rankedPersonalities,
    history,
    hallOfFame: {
      fastestGame,
      longestGame,
      highestScorePlayer,
      mostNoblesPlayer,
      mostReservedPlayer,
      mostPurchasedPlayer,
    },
  };
}
