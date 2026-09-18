import {
  createAnalyticsState,
  createHumanPlayerRecord,
  createPersonalityRecord,
} from "./createAnalyticsState";

function isHuman(player) {
  return player.type === "human" || typeof player.personality === "string" || !player.personality?.id;
}
function personalityId(player) { return isHuman(player) ? "human" : player.personality.id; }
function personalityName(player) { return isHuman(player) ? "Human" : player.personality.name; }
function totalTokens(tokens = {}) { return Object.values(tokens).reduce((sum, value) => sum + value, 0); }
function discounts(player) {
  return (player.purchasedCards || []).reduce((result, card) => {
    if (card.bonusColor) result[card.bonusColor] = (result[card.bonusColor] || 0) + 1;
    return result;
  }, {});
}
function snapshot(player, winners, index, winningScore) {
  const isWinner = winners.some((winner) => winner.name === player.name);
  const opponentScores = winners.length ? winningScore : 0;
  return {
    profileId: player.profileId || null,
    name: player.name,
    type: isHuman(player) ? "human" : "ai",
    personalityId: personalityId(player),
    personalityName: personalityName(player),
    seat: index + 1,
    points: player.points || 0,
    purchasedCards: (player.purchasedCards || []).length,
    reservedCards: (player.reservedCards || []).length,
    nobles: (player.nobles || []).length,
    finalTokens: { ...(player.tokens || {}) },
    finalTokenCount: totalTokens(player.tokens),
    finalDiscounts: discounts(player),
    isWinner,
    sharedVictory: isWinner && winners.length > 1,
    victoryMargin: isWinner ? Math.max(0, (player.points || 0) - Math.max(0, ...winners.filter((winner) => winner.name !== player.name).map((winner) => winner.points || 0), opponentScores === player.points ? 0 : opponentScores)) : 0,
  };
}
function matchupType(players) {
  const humanCount = players.filter(isHuman).length;
  const aiCount = players.length - humanCount;
  if (humanCount > 0 && aiCount === 0) return "humanVsHuman";
  if (humanCount === 1 && aiCount > 0) return "humanVsAi";
  return "mixed";
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function recordCompletedGame({ analytics, players, winners, turnCount, gameState = null }) {
  const updated = clone(analytics || createAnalyticsState());
  const validWinners = Array.isArray(winners) ? winners : [];
  const winningScore = validWinners.length ? Math.max(...validWinners.map((winner) => winner.points)) : 0;
  const gameNumber = (updated.gamesPlayed || 0) + 1;
  const matchup = matchupType(players);
  updated.personalities ||= createAnalyticsState().personalities;
  updated.humanPlayers ||= {};
  updated.matchHistory ||= [];
  updated.gamesPlayed = gameNumber;
  updated.totalTurns = (updated.totalTurns || 0) + turnCount;
  updated.totalWinningScore = (updated.totalWinningScore || 0) + winningScore;
  updated.highestWinningScore = Math.max(updated.highestWinningScore || 0, winningScore);

  for (const player of players) {
    const won = validWinners.some((winner) => winner.name === player.name);
    if (isHuman(player)) {
      const key = player.profileId || player.name.trim().toLowerCase();
      const record = updated.humanPlayers[key] || createHumanPlayerRecord(player.name);
      record.profileId = player.profileId || record.profileId || null;
      record.games += 1;
      record.totalScore += player.points;
      record.highestScore = Math.max(record.highestScore, player.points);
      record.matchups[matchup].games += 1;
      if (won) {
        record.wins += 1;
        record.matchups[matchup].wins += 1;
        if (validWinners.length > 1) record.sharedWins += 1;
      }
      updated.humanPlayers[key] = record;
      continue;
    }
    const id = player.personality.id;
    const record = updated.personalities[id] || createPersonalityRecord();
    record.games += 1;
    record.totalScore += player.points;
    record.totalPurchasedCards += player.purchasedCards.length;
    record.totalReservedCards += player.reservedCards.length;
    record.totalNobles += player.nobles.length;
    record.highestScore = Math.max(record.highestScore, player.points);
    if (won) {
      record.wins += 1;
      if (validWinners.length > 1) record.sharedWins += 1;
    }
    updated.personalities[id] = record;
  }

  updated.matchHistory.unshift({
    gameNumber,
    completedAt: new Date().toISOString(),
    turnCount,
    winningScore,
    victoryTarget: Math.max(...players.map((player) => player.points || 0), winningScore),
    matchupType: matchup,
    winnerNames: validWinners.map((winner) => winner.name),
    winnerPersonalities: validWinners.map(personalityName),
    players: players.map((player, index) => snapshot(player, validWinners, index, winningScore)),
    finalBoard: gameState ? {
      bank: clone(gameState.bank || gameState.gemSupply || {}),
      availableNobles: clone(gameState.availableNobles || []),
      tier1Market: clone(gameState.tier1Market || []),
      tier2Market: clone(gameState.tier2Market || []),
      tier3Market: clone(gameState.tier3Market || []),
      players: clone((gameState.players || []).map((player) => ({
        id: player.id,
        name: player.name,
        type: player.type,
        personalityId: personalityId(player),
        points: player.points || 0,
        tokens: player.tokens || {},
        purchasedCards: player.purchasedCards || [],
        reservedCards: player.reservedCards || [],
        nobles: player.nobles || [],
      }))),
    } : null,
    gameLog: clone(gameState?.gameLog || []),
  });
  updated.matchHistory = updated.matchHistory.slice(0, 250);
  return updated;
}
