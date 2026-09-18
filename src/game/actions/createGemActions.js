import { addGameLogEntry } from "../gameLog";
export function createGemActions({ setGameState, finishTurn }) {
  function collectGem(color) {
    if (color === "gold") return;

    setGameState((current) => {
      if (current.actionsRemaining === 0 || current.bank[color] <= 0) {
        return current;
      }

      const player = current.players[current.currentPlayer];
      const ownedTokenTotal = Object.values(player.tokens).reduce(
        (total, count) => total + count,
        0,
      );
      const selected = current.selectedTokens || [];
      const pendingTokenTotal = ownedTokenTotal + selected.length;

      if (pendingTokenTotal >= 10 || selected.length >= 3) {
        return current;
      }

      const isSecondSelection = selected.length === 1;
      const isSecondSameColor = isSecondSelection && selected[0] === color;
      const alreadyHasDuplicate = new Set(selected).size !== selected.length;

      if (isSecondSameColor && current.bank[color] < 3) {
        return current;
      }

      if (
        selected.length >= 2 &&
        (selected.includes(color) || alreadyHasDuplicate)
      ) {
        return current;
      }

      const updated = structuredClone(current);
      updated.bank[color] -= 1;
      updated.selectedTokens.push(color);
      updated.cardAction = "collect";
      return updated;
    });
  }

  function removeSelectedGem(color) {
    setGameState((current) => {
      const tokenIndex = current.selectedTokens.indexOf(color);
      if (tokenIndex === -1) return current;

      const updated = structuredClone(current);
      updated.selectedTokens.splice(tokenIndex, 1);
      updated.bank[color] += 1;
      return updated;
    });
  }

  function confirmGemSelection() {
    setGameState((current) => {
      const player = current.players[current.currentPlayer];
      const ownedTokenTotal = Object.values(player.tokens).reduce(
        (total, count) => total + count,
        0,
      );
      const selected = current.selectedTokens || [];
      const pendingTokenTotal = ownedTokenTotal + selected.length;

      const completedTwoSame =
        selected.length === 2 && selected[0] === selected[1];
      const selectedDistinctColors = new Set(selected);
      const completedThreeDifferent =
        selected.length === 3 && selectedDistinctColors.size === 3;
      const reachedTokenLimit =
        pendingTokenTotal === 10 && selected.length > 0;
      const selectableStandardColors = ["white", "blue", "green", "red", "black"]
        .filter((color) => (current.bank[color] || 0) > 0);
      const noAdditionalDistinctGemAvailable =
        selected.length > 0 &&
        selectedDistinctColors.size === selected.length &&
        selectableStandardColors.every((color) => selectedDistinctColors.has(color));

      if (
        pendingTokenTotal > 10 ||
        (!completedTwoSame &&
          !completedThreeDifferent &&
          !reachedTokenLimit &&
          !noAdditionalDistinctGemAvailable)
      ) {
        return current;
      }

      const updated = structuredClone(current);
      const updatedPlayer = updated.players[updated.currentPlayer];

      const collected = [...updated.selectedTokens];
      updated.selectedTokens.forEach((selectedColor) => {
        updatedPlayer.tokens[selectedColor] += 1;
      });
      addGameLogEntry(
        updated,
        updatedPlayer,
        `${updatedPlayer.name} collected ${collected.join(", ")}.`,
      );

      finishTurn(updated);
      return updated;
    });
  }

  return {
    collectGem,
    removeSelectedGem,
    confirmGemSelection,
    endTurn: confirmGemSelection,
  };
}
