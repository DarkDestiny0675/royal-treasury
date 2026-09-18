import { useEffect, useRef, useState } from "react";
import { createThemedGame } from "../game/cards/createThemedGame";
import { createSimulationState } from "../game/analytics/createSimulationState";
import { clearAnalytics, loadAnalytics } from "../game/analytics/analyticsStorage";
import { createFinishTurn } from "../game/engine/createFinishTurn";
import { createPlayerActions } from "../game/actions/createPlayerActions";
import { createPerformAiTurn } from "../game/ai/createPerformAiTurn";
import { clearSavedGame, loadSavedGame, saveGame } from "../game/storage/gameStorage";
import { useGameEffects } from "./useGameEffects";

const SAVE_FEEDBACK_DURATION_MS = 3000;

const DEFAULT_OPTIONS = {
  sessionName: "Royal Treasury Match",
  playerName: "Michael",
  playerCount: 4,
  victoryTarget: 20,
  tier1Cards: 40,
  tier2Cards: 30,
  tier3Cards: 20,
};

function formatSavedAt(savedAt) {
  if (!savedAt) return "Not saved";
  return new Date(savedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function useRoyalTreasuryGame() {
  const [gameState, setGameState] = useState(() => createThemedGame(DEFAULT_OPTIONS));
  const [gameActive, setGameActive] = useState(false);
  const [saveRecord, setSaveRecord] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveLoading, setSaveLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [analytics, setAnalytics] = useState(loadAnalytics);
  const [simulation, setSimulation] = useState(createSimulationState);
  const [showGameSummary, setShowGameSummary] = useState(true);
  const recordedGameRef = useRef(false);
  const saveFeedbackTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadSavedGame()
      .then((saved) => { if (!cancelled) { setSaveRecord(saved); if(saved?.gameState){/* recovery metadata loaded */} } })
      .catch((error) => { if (!cancelled) setSaveMessage(error.message); })
      .finally(() => { if (!cancelled) setSaveLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimeoutRef.current) {
        clearTimeout(saveFeedbackTimeoutRef.current);
      }
    };
  }, []);

  function clearSaveFeedbackTimeout() {
    if (saveFeedbackTimeoutRef.current) {
      clearTimeout(saveFeedbackTimeoutRef.current);
      saveFeedbackTimeoutRef.current = null;
    }
  }

  function scheduleSaveStatusReset() {
    clearSaveFeedbackTimeout();
    saveFeedbackTimeoutRef.current = setTimeout(() => {
      setSaveStatus("idle");
      saveFeedbackTimeoutRef.current = null;
    }, SAVE_FEEDBACK_DURATION_MS);
  }

  function isAiPlayer(playerIndex) {
    return simulation.active || gameState.players[playerIndex]?.type === "ai";
  }

  const finishTurn = createFinishTurn(isAiPlayer);
  const performAiTurn = createPerformAiTurn({ setGameState, finishTurn });
  const playerActions = createPlayerActions({ setGameState, finishTurn });

  function returnSelectedGem(color) {
    setGameState((current) => {
      const selectedIndex = (current.selectedTokens || []).indexOf(color);
      if (selectedIndex < 0) return current;
      const selectedTokens = [...(current.selectedTokens || [])];
      selectedTokens.splice(selectedIndex, 1);
      const supplyKey = current.bank ? "bank" : "gemSupply";
      const supply = current[supplyKey] || {};
      return {
        ...current,
        selectedTokens,
        [supplyKey]: { ...supply, [color]: (supply[color] || 0) + 1 },
      };
    });
  }

  useGameEffects({
    gameState,
    gameActive,
    simulation,
    performAiTurn,
    recordedGameRef,
    setAnalytics,
    setGameState,
    setSimulation,
    setShowGameSummary,
    createGame: createThemedGame,
  });

  function startNewGame(options = DEFAULT_OPTIONS) {
    recordedGameRef.current = false;
    setSimulation(createSimulationState());
    setShowGameSummary(true);
    setGameState(createThemedGame(options));
    setGameActive(false);
    setSaveMessage("");
  }

  async function saveCurrentGame() {
    if (saveStatus === "saving") return false;

    clearSaveFeedbackTimeout();
    setSaveStatus("saving");
    setSaveMessage("");

    try {
      const saved = await saveGame(gameState, saveRecord?.matchId);
      setSaveRecord(saved);
      setSaveMessage("Game saved to SQLite successfully.");
      setSaveStatus("saved");
      scheduleSaveStatusReset();
      return true;
    } catch (error) {
      setSaveMessage(error.message);
      setSaveStatus("failed");
      scheduleSaveStatusReset();
      return false;
    }
  }

  async function continueSavedGame() {
    if (resumeLoading) return false;

    setResumeLoading(true);
    setSaveMessage("");

    try {
      const saved = await loadSavedGame();
      if (!saved?.gameState || !Array.isArray(saved.gameState.players)) {
        setSaveRecord(null);
        setSaveMessage("No active local game was found.");
        return false;
      }

      const restored = saved.gameState;
      const currentPlayer = restored.players[restored.currentPlayer];
      const aiTurn = currentPlayer?.type === "ai";

      recordedGameRef.current = Boolean(restored.gameOver);
      setSimulation(createSimulationState());
      setShowGameSummary(true);
      setGameState({
        ...restored,
        aiThinking: aiTurn,
        aiMessage: aiTurn ? `${currentPlayer.name} is thinking...` : "",
      });
      setSaveRecord(saved);
      setGameActive(true);
      clearSaveFeedbackTimeout();
      setSaveStatus("idle");
      return true;
    } catch (error) {
      setSaveMessage(error.message);
      return false;
    } finally {
      setResumeLoading(false);
    }
  }

  async function deleteSavedGame() {
    if (deleteLoading) return false;

    const matchId = saveRecord?.matchId;
    if (!matchId) {
      setSaveRecord(null);
      setSaveMessage("No active local game was found.");
      return false;
    }

    setDeleteLoading(true);
    setSaveMessage("");

    try {
      await clearSavedGame(matchId);
      setSaveRecord(null);
      setGameActive(false);
      setSaveMessage("Saved game deleted from SQLite.");
      clearSaveFeedbackTimeout();
      setSaveStatus("idle");
      return true;
    } catch (error) {
      setSaveMessage(error.message);
      return false;
    } finally {
      setDeleteLoading(false);
    }
  }

  function pauseGame() { setGameActive(false); }
  function resumeGame() { setGameActive(true); }
  function handleClearAnalytics() { setAnalytics(clearAnalytics()); }

  function runSimulation(gameCount) {
    recordedGameRef.current = false;
    setGameActive(false);
    setSimulation({
      active: true,
      requestedGames: gameCount,
      completedGames: 0,
      delayMilliseconds: 25,
      nextGameDelayMilliseconds: 750,
    });
    setGameState(() => {
      const game = createThemedGame(DEFAULT_OPTIONS);
      game.aiThinking = true;
      game.aiMessage = `${game.players[0].name} is thinking...`;
      return game;
    });
  }

  function stopSimulation() {
    setSimulation(createSimulationState());
    setGameState((current) => ({ ...current, aiThinking: false, aiMessage: "" }));
  }

  return {
    gameState,
    gameActive,
    savedGameAvailable: Boolean(saveRecord),
    savedGameState: saveRecord?.gameState || null,
    savedAtLabel: formatSavedAt(saveRecord?.savedAt),
    saveMessage,
    saveLoading,
    saveStatus,
    resumeLoading,
    deleteLoading,
    analytics,
    simulation,
    showGameSummary,
    actions: {
      ...playerActions,
      returnSelectedGem,
      startNewGame,
      saveCurrentGame,
      continueSavedGame,
      deleteSavedGame,
      pauseGame,
      resumeGame,
      handleClearAnalytics,
      runSimulation,
      stopSimulation,
    },
  };
}
