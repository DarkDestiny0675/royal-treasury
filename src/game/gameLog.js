export function createGameLogEntry(turn, playerName, personality, action) {
  return {
    id: crypto.randomUUID(),
    turn,
    playerName,
    personality: personality || "Human",
    action,
  };
}

export function addGameLogEntry(gameState, player, action) {
  if (!Array.isArray(gameState.gameLog)) gameState.gameLog = [];
  gameState.gameLog.push(
    createGameLogEntry(
      (gameState.turnCount || 0) + 1,
      player?.name || "Royal Treasury",
      player?.type === "ai"
        ? player.personality?.name || player.personalityId || "AI"
        : "Human",
      action,
    ),
  );
}
