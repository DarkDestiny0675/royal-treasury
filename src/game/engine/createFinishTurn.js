import { addGameLogEntry } from "../gameLog";
import { getGameWinners } from "../getGameWinners";

const TEST_MODE = false;

export function createFinishTurn(isAiPlayer) {
  return function finishTurn(updated) {
    updated.turnCount += 1;

    if (
      updated.finalRoundTriggered &&
      updated.finalRoundStartingPlayer !== null
    ) {
      const nextPlayer = TEST_MODE
        ? 0
        : (updated.currentPlayer + 1) % updated.players.length;

      if (!TEST_MODE && nextPlayer === updated.finalRoundStartingPlayer) {
        updated.gameOver = true;
        updated.winners = getGameWinners(updated.players);
      }

      updated.currentPlayer = nextPlayer;
    } else if (TEST_MODE) {
      updated.currentPlayer = 0;
    } else {
      updated.currentPlayer =
        (updated.currentPlayer + 1) % updated.players.length;
    }

    if (updated.gameOver) {
      const winnerNames = (updated.winners || [])
        .map((winner) => winner.name)
        .filter(Boolean);

      updated.aiThinking = false;
      updated.aiMessage =
        winnerNames.length === 1
          ? `${winnerNames[0]} WON!`
          : winnerNames.length > 1
            ? `${winnerNames.join(" & ")} WON!`
            : "GAME OVER";
      if (winnerNames.length > 0) {
        addGameLogEntry(
          updated,
          updated.winners[0],
          `${winnerNames.join(" & ")} won the game.`,
        );
      }
    } else {
      const nextPlayerName = updated.players[updated.currentPlayer].name;

      if (isAiPlayer(updated.currentPlayer)) {
        updated.aiThinking = true;
        updated.aiMessage = `${nextPlayerName} is thinking...`;
      } else {
        updated.aiThinking = false;
        updated.aiMessage = `${nextPlayerName}'s Turn`;
      }
    }

    updated.selectedTokens = [];
    updated.actionMode = "threeDifferent";
    updated.cardAction = "purchase";
    updated.actionsRemaining = 1;
  };
}
