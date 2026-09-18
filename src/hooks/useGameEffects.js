import { useEffect, useRef } from "react";
import { getAiDelay } from "../game/getAiDelay";
import { recordCompletedGame } from "../game/analytics/recordCompletedGame";
import { saveAnalytics } from "../game/analytics/analyticsStorage";

export function useGameEffects({ gameState, gameActive, simulation, performAiTurn, recordedGameRef, setAnalytics, setGameState, setSimulation, setShowGameSummary, createGame }) {
  const performAiTurnRef = useRef(performAiTurn);
  useEffect(() => { performAiTurnRef.current = performAiTurn; }, [performAiTurn]);
  useEffect(() => {
    if ((!gameActive && !simulation.active) || !gameState.aiThinking || gameState.gameOver) return undefined;
    const timer = window.setTimeout(() => performAiTurnRef.current(), simulation.active ? simulation.delayMilliseconds : getAiDelay());
    return () => window.clearTimeout(timer);
  }, [gameActive, gameState.aiThinking, gameState.currentPlayer, gameState.gameOver, simulation.active, simulation.delayMilliseconds]);
  useEffect(() => { if (!gameState.gameOver) setShowGameSummary(true); }, [gameState.gameOver, setShowGameSummary]);
  useEffect(() => {
    if (!gameState.gameOver) { recordedGameRef.current = false; return; }
    if (recordedGameRef.current || !Array.isArray(gameState.winners) || gameState.winners.length === 0) return;
    recordedGameRef.current = true;
    setAnalytics((currentAnalytics) => {
      const updatedAnalytics = recordCompletedGame({ analytics: currentAnalytics, players: gameState.players, winners: gameState.winners, turnCount: gameState.turnCount, gameState });
      saveAnalytics(updatedAnalytics);
      return updatedAnalytics;
    });
    if (simulation.active) {
      setSimulation((currentSimulation) => {
        const completedGames = currentSimulation.completedGames + 1;
        return { ...currentSimulation, active: completedGames < currentSimulation.requestedGames, completedGames };
      });
    }
  }, [gameState, recordedGameRef, setAnalytics, setSimulation, simulation.active]);
  useEffect(() => {
    if (!simulation.active || !gameState.gameOver || simulation.completedGames >= simulation.requestedGames) return undefined;
    const timer = window.setTimeout(() => {
      recordedGameRef.current = false;
      setGameState(() => {
        const nextGame = createGame({ playerCount: 4, victoryTarget: 15 });
        nextGame.aiThinking = true;
        nextGame.aiMessage = `${nextGame.players[0].name} is thinking...`;
        return nextGame;
      });
    }, simulation.nextGameDelayMilliseconds);
    return () => window.clearTimeout(timer);
  }, [createGame, gameState.gameOver, recordedGameRef, setGameState, simulation.active, simulation.completedGames, simulation.nextGameDelayMilliseconds, simulation.requestedGames]);
}
