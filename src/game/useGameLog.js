import { createGameLogEntry } from "./gameLog";

export function addGameLogEntry(updated, player, action) {
  updated.gameLog.unshift(
    createGameLogEntry(
      updated.turnCount,
      player.name,
      player.personality?.name ?? "Unknown",
      action,
    ),
  );

  updated.gameLog = updated.gameLog.slice(0, 250);
}
