import { useEffect, useRef } from "react";
import {
  playSound,
  refreshAudioSettings,
  setMusicScene,
  unlockAudio,
} from "./soundEngine";

function countPlayerItems(players, key) {
  return (players || []).reduce(
    (total, player) => total + (player[key] || []).length,
    0,
  );
}

function SoundDirector({ activeScreen, gameState, simulationActive }) {
  const previous = useRef(null);

  useEffect(() => {
    function unlock() {
      unlockAudio();
    }
    function settingChanged() {
      refreshAudioSettings();
    }
    document.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("royal-treasury-setting-changed", settingChanged);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      window.removeEventListener(
        "royal-treasury-setting-changed",
        settingChanged,
      );
    };
  }, []);

  useEffect(() => {
    if (simulationActive) {
      setMusicScene(null);
      return;
    }
    const scene = gameState.gameOver
      ? "victory"
      : activeScreen === "game"
        ? "game"
        : "menu";
    setMusicScene(scene);
  }, [activeScreen, gameState.gameOver, simulationActive]);

  useEffect(() => {
    if (simulationActive) return;
    const snapshot = {
      selected: (gameState.selectedTokens || []).length,
      purchased: countPlayerItems(gameState.players, "purchasedCards"),
      reserved: countPlayerItems(gameState.players, "reservedCards"),
      nobles: countPlayerItems(gameState.players, "nobles"),
      currentPlayer: gameState.currentPlayer,
      gameOver: gameState.gameOver,
    };
    const old = previous.current;
    if (old) {
      if (snapshot.selected > old.selected) playSound("gem");
      if (
        snapshot.selected < old.selected &&
        snapshot.currentPlayer === old.currentPlayer
      )
        playSound("returnGem");
      if (snapshot.purchased > old.purchased) playSound("purchase");
      if (snapshot.reserved > old.reserved) playSound("reserve");
      if (snapshot.nobles > old.nobles) playSound("noble");
      if (snapshot.currentPlayer !== old.currentPlayer) playSound("confirm");
      if (snapshot.gameOver && !old.gameOver) playSound("victory");
    }
    previous.current = snapshot;
  }, [gameState, simulationActive]);

  useEffect(() => {
    function handleClick(event) {
      if (simulationActive) return;
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      const label =
        `${button.textContent || ""} ${button.className || ""}`.toLowerCase();
      if (label.includes("purchase")) return;
      if (label.includes("reserve")) return;
      if (label.includes("confirm turn")) return;
      playSound("click");
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [simulationActive]);

  return null;
}

export default SoundDirector;
