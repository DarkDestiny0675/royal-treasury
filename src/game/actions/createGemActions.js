import { addGameLogEntry } from "../gameLog";

const STANDARD_COLORS = ["white", "blue", "green", "red", "black"];
const ALL_COLORS = [...STANDARD_COLORS, "gold"];

function tokenTotal(player) {
  return Object.values(player.tokens || {}).reduce(
    (total, count) => total + (Number(count) || 0),
    0,
  );
}

export function createGemActions({ setGameState, finishTurn }) {
  function collectGem(color) {
    if (!STANDARD_COLORS.includes(color)) return;
    setGameState((current) => {
      if (current.actionsRemaining === 0 || (current.bank?.[color] || 0) <= 0) {
        return current;
      }

      const player = current.players[current.currentPlayer];
      const selected = current.selectedTokens || [];
      const pendingTokenTotal = tokenTotal(player) + selected.length;

      if (current.exchangePending) {
        if (selected.length >= 1 || pendingTokenTotal >= 10) return current;
        const updated = structuredClone(current);
        updated.bank[color] -= 1;
        updated.selectedTokens.push(color);
        updated.message = `${player.name} selected a replacement token.`;
        return updated;
      }

      if (pendingTokenTotal >= 10 || selected.length >= 3) return current;
      const isSecondSameColor = selected.length === 1 && selected[0] === color;
      const alreadyHasDuplicate = new Set(selected).size !== selected.length;
      if (isSecondSameColor && current.bank[color] < 3) return current;
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
      const tokenIndex = (current.selectedTokens || []).indexOf(color);
      if (tokenIndex === -1) return current;
      const updated = structuredClone(current);
      updated.selectedTokens.splice(tokenIndex, 1);
      updated.bank[color] += 1;
      if (updated.exchangePending) {
        updated.message = `${updated.players[updated.currentPlayer].name} must select one replacement token.`;
      }
      return updated;
    });
  }

  function returnInventoryGem(color) {
    if (!ALL_COLORS.includes(color)) return;
    setGameState((current) => {
      const player = current.players[current.currentPlayer];
      if (
        (player.tokens?.[color] || 0) <= 0 ||
        (current.selectedTokens || []).length > 0 ||
        current.exchangePending
      ) {
        return current;
      }

      const updated = structuredClone(current);
      const updatedPlayer = updated.players[updated.currentPlayer];
      updatedPlayer.tokens[color] -= 1;
      updated.bank[color] = (updated.bank[color] || 0) + 1;
      updated.exchangePending = true;
      updated.cardAction = "exchange";
      updated.message = `${updatedPlayer.name} returned a token and must select one replacement.`;
      return updated;
    });
  }

  function confirmGemSelection() {
    setGameState((current) => {
      const player = current.players[current.currentPlayer];
      const selected = current.selectedTokens || [];
      const pendingTokenTotal = tokenTotal(player) + selected.length;
      const exchangeComplete = current.exchangePending && selected.length === 1;
      const completedTwoSame = selected.length === 2 && selected[0] === selected[1];
      const selectedDistinctColors = new Set(selected);
      const completedThreeDifferent =
        selected.length === 3 && selectedDistinctColors.size === 3;
      const reachedTokenLimit = pendingTokenTotal === 10 && selected.length > 0;
      const selectableStandardColors = STANDARD_COLORS.filter(
        (color) => (current.bank[color] || 0) > 0,
      );
      const noAdditionalDistinctGemAvailable =
        selected.length > 0 &&
        selectedDistinctColors.size === selected.length &&
        selectableStandardColors.every((color) => selectedDistinctColors.has(color));

      if (
        pendingTokenTotal > 10 ||
        (!exchangeComplete &&
          !completedTwoSame &&
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
        updated.exchangePending
          ? `${updatedPlayer.name} exchanged a token for ${collected[0]}.`
          : `${updatedPlayer.name} collected ${collected.join(", ")}.`,
      );
      updated.exchangePending = false;
      finishTurn(updated);
      return updated;
    });
  }

  return {
    collectGem,
    removeSelectedGem,
    returnInventoryGem,
    confirmGemSelection,
    endTurn: confirmGemSelection,
  };
}
