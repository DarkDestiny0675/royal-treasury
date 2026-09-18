const AI_PERSONALITY_IDS = ["builder", "nobleHunter", "investor", "finisher"];

function safeAverage(total, count) {
  return count ? Number((total / count).toFixed(2)) : 0;
}

export function getAnalyticsMetrics(analytics) {
  const gamesPlayed = analytics.gamesPlayed || 0;
  const personalityMetrics = AI_PERSONALITY_IDS.map((id) => {
    const record = analytics.personalities?.[id] || {};
    return {
      id,
      games: record.games || 0,
      wins: record.wins || 0,
      sharedWins: record.sharedWins || 0,
      winRate: safeAverage((record.wins || 0) * 100, record.games || 0),
      averageScore: safeAverage(record.totalScore || 0, record.games || 0),
      averagePurchasedCards: safeAverage(record.totalPurchasedCards || 0, record.games || 0),
      averageReservedCards: safeAverage(record.totalReservedCards || 0, record.games || 0),
      averageNobles: safeAverage(record.totalNobles || 0, record.games || 0),
      highestScore: record.highestScore || 0,
    };
  });

  return {
    gamesPlayed,
    averageTurns: safeAverage(analytics.totalTurns || 0, gamesPlayed),
    averageWinningScore: safeAverage(analytics.totalWinningScore || 0, gamesPlayed),
    highestWinningScore: analytics.highestWinningScore || 0,
    personalityMetrics,
  };
}
