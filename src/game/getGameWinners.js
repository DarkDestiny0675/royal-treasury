export function getGameWinners(players) {
  if (!players || players.length === 0) {
    return [];
  }

  const highestScore = Math.max(...players.map((player) => player.points));

  const highestScoringPlayers = players.filter(
    (player) => player.points === highestScore,
  );

  const fewestPurchasedCards = Math.min(
    ...highestScoringPlayers.map((player) => player.purchasedCards.length),
  );

  return highestScoringPlayers.filter(
    (player) => player.purchasedCards.length === fewestPurchasedCards,
  );
}
