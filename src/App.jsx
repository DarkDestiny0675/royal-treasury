import { useCallback, useEffect, useState } from "react";
import "./App.css";
import "./components/Analytics/AnalyticsPanel.css";
import "./components/GameLog/GameLogPanel.css";
import "./components/Statistics/StatisticsScreen.css";
import "./components/PlayerStats/PlayerStatsScreen.css";
import "./components/Tutorial/TutorialScreen.css";
import "./components/AppShell/AppShell.css";
import "./components/Screens/Screens.css";
import "./components/Screens/RandomSeatingScreen.css";
import "./components/Screens/GameCountdownScreen.css";
import "./components/Screens/SaveLoadMenu.css";
import "./components/Screens/SessionDashboard.css";
import AnalyticsPanel from "./components/Analytics/AnalyticsPanel";
import AdminAccessModal from "./components/Admin/AdminAccessModal";
import AdminScreen from "./components/Admin/AdminScreen";
import GameSummary from "./components/Board/GameSummary";
import GameBoard from "./components/GameBoard/GameBoard";
import AppShell from "./components/AppShell/AppShell";
import MainMenuScreen from "./components/Screens/MainMenuScreen";
import LoginScreen from "./components/Screens/LoginScreen";
import CreateAccountScreen from "./components/Screens/CreateAccountScreen";
import OnlineLobbyScreen from "./components/Screens/OnlineLobbyScreen";
import OnlineWaitingRoomScreen from "./components/Screens/OnlineWaitingRoomScreen";
import OnlineMatchStagedScreen from "./components/Screens/OnlineMatchStagedScreen";
import OnlineGameScreen from "./components/Screens/OnlineGameScreen";
import GameSetupScreen from "./components/Screens/GameSetupScreen";
import RandomSeatingScreen from "./components/Screens/RandomSeatingScreen";
import GameCountdownScreen from "./components/Screens/GameCountdownScreen";
import SettingsScreen from "./components/Screens/SettingsScreen";
import CreditsScreen from "./components/Screens/CreditsScreen";
import CommunityScreen from "./components/Community/CommunityScreen";
import StatisticsScreen from "./components/Statistics/StatisticsScreen";
import PlayerStatsScreen from "./components/PlayerStats/PlayerStatsScreen";
import TutorialScreen from "./components/Tutorial/TutorialScreen";
import SoundDirector from "./audio/SoundDirector";
import { restoreAuthSession, useAuthSession } from "./auth/authSession";
import { loadMyActiveMatch } from "./services/matchApi";
import { lockAdmin, useAdminAccess } from "./settings/adminStore";
import { usePlayerProfile } from "./settings/playerProfileStore";
import { useRoyalTreasuryGame } from "./hooks/useRoyalTreasuryGame";
function App() {
  const [activeScreen, setActiveScreen] = useState("menu"),
    [showAdminModal, setShowAdminModal] = useState(false),
    [activeOnlineRoom, setActiveOnlineRoom] = useState(null),
    [stagedMatchId, setStagedMatchId] = useState(null),
    [activeOnlineRole, setActiveOnlineRole] = useState("");
  const adminUnlocked = useAdminAccess(),
    onlineUser = useAuthSession(),
    profile = usePlayerProfile(),
    game = useRoyalTreasuryGame();
  const {
    gameState,
    gameActive,
    savedGameAvailable,
    analytics,
    simulation,
    showGameSummary,
    actions,
    savedGameState,
    savedAtLabel,
    saveStatus,
  } = game;
  useEffect(() => {
    restoreAuthSession();
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!onlineUser)
      return () => {
        cancelled = true;
      };
    loadMyActiveMatch()
      .then((match) => {
        if (cancelled) return;
        setActiveOnlineRoom({
          roomId: match.roomId,
          activeMatchId: match.matchId,
        });
        setStagedMatchId(match.matchId);
        setActiveScreen("onlineGame");
      })
      .catch((error) => {
        if (error.status !== 404)
          console.error("Unable to restore active online match.", error);
      });
    return () => {
      cancelled = true;
    };
  }, [onlineUser]);
  function navigate(screen) {
    if (
      ["admin", "laboratory", "gameAnalytics"].includes(screen) &&
      !adminUnlocked
    ) {
      setShowAdminModal(true);
      return;
    }
    if ((activeScreen === "game" && screen !== "game") || screen === "tutorial")
      actions.pauseGame();
    if (screen === "game" && gameActive) actions.resumeGame();
    setActiveScreen(screen);
  }
  function startConfiguredGame(options) {
    actions.startNewGame(options);
    setActiveScreen("seating");
  }
  function lockAdminMode() {
    lockAdmin();
    setActiveScreen("menu");
  }
  const beginGameAfterCountdown = useCallback(() => {
    actions.resumeGame();
    setActiveScreen("game");
  }, [actions]);
  function openOnline() {
    setActiveScreen(onlineUser ? "onlineLobby" : "login");
  }
  function renderScreen() {
    if (activeScreen === "menu")
      return (
        <MainMenuScreen
          onContinue={() =>
            actions.continueSavedGame() && setActiveScreen("game")
          }
          onNewGame={() => setActiveScreen("setup")}
          onOnlineGame={openOnline}
          onStatistics={() => setActiveScreen("playerStats")}
          onSettings={() => setActiveScreen("settings")}
          onCredits={() => setActiveScreen("credits")}
          onDeleteSave={actions.deleteSavedGame}
          gamesPlayed={analytics.gamesPlayed}
          canContinue={savedGameAvailable}
          saveSummary={{
            sessionName:
              savedGameState?.options?.sessionName || "Royal Treasury Match",
            players: savedGameState?.players?.length || 0,
            turn: savedGameState?.turnCount || 0,
            victoryTarget: savedGameState?.victoryTarget || 20,
            savedAt: savedAtLabel,
          }}
        />
      );
    if (activeScreen === "login")
      return (
        <LoginScreen
          onAuthenticated={() => setActiveScreen("onlineLobby")}
          onCreateAccount={() => setActiveScreen("createAccount")}
          onBack={() => setActiveScreen("menu")}
        />
      );
    if (activeScreen === "createAccount")
      return (
        <CreateAccountScreen
          onAuthenticated={() => setActiveScreen("onlineLobby")}
          onBack={() => setActiveScreen("login")}
        />
      );
    if (activeScreen === "onlineLobby")
      return (
        <OnlineLobbyScreen
          user={onlineUser}
          onBack={() => setActiveScreen("menu")}
          onOpenRoom={(room) => {
            setActiveOnlineRoom(room);
            setActiveScreen("onlineWaitingRoom");
          }}
        />
      );
    if (activeScreen === "onlineWaitingRoom")
      return (
        <OnlineWaitingRoomScreen
          initialRoom={activeOnlineRoom}
          user={onlineUser}
          onBack={() => setActiveScreen("onlineLobby")}
          onMatchStaged={(result) => {
            setActiveOnlineRoom(result.room);
            setStagedMatchId(result.matchId);
            const isSpectator = (result.room?.spectators || []).some(
              (spectator) => spectator.userId === onlineUser?.userId,
            );
            setActiveOnlineRole(isSpectator ? "spectator" : "player");
            setActiveScreen(isSpectator ? "onlineGame" : "onlineMatchStaged");
          }}
        />
      );
    if (activeScreen === "onlineMatchStaged")
      return (
        <OnlineMatchStagedScreen
          room={activeOnlineRoom}
          matchId={stagedMatchId}
          onEnter={() => setActiveScreen("onlineGame")}
          onBack={() => setActiveScreen("onlineLobby")}
        />
      );
    if (activeScreen === "onlineGame")
      return (
        <OnlineGameScreen
          matchId={stagedMatchId || activeOnlineRoom?.activeMatchId}
          user={onlineUser}
          onRoleChange={setActiveOnlineRole}
          onExit={() => setActiveScreen("onlineLobby")}
        />
      );
    if (activeScreen === "setup")
      return (
        <GameSetupScreen
          onStart={startConfiguredGame}
          onBack={() => setActiveScreen("menu")}
        />
      );
    if (activeScreen === "seating")
      return (
        <RandomSeatingScreen
          entrants={gameState.seatingEntrants || gameState.players}
          players={gameState.players}
          onComplete={() => setActiveScreen("countdown")}
        />
      );
    if (activeScreen === "countdown")
      return (
        <GameCountdownScreen
          firstPlayer={gameState.players[0]}
          onComplete={beginGameAfterCountdown}
        />
      );
    if (activeScreen === "playerStats")
      return <PlayerStatsScreen analytics={analytics} profile={profile} />;
    if (activeScreen === "community")
      return onlineUser ? (
        <CommunityScreen user={onlineUser} />
      ) : (
        <LoginScreen
          onAuthenticated={() => setActiveScreen("community")}
          onCreateAccount={() => setActiveScreen("createAccount")}
          onBack={() => setActiveScreen("menu")}
        />
      );
    if (activeScreen === "tutorial")
      return (
        <TutorialScreen
          gameState={gameState}
          actions={actions}
          onExit={() => setActiveScreen("menu")}
        />
      );
    if (activeScreen === "gameAnalytics" && adminUnlocked)
      return <StatisticsScreen analytics={analytics} />;
    if (activeScreen === "laboratory" && adminUnlocked)
      return (
        <AnalyticsPanel
          analytics={analytics}
          simulation={simulation}
          onClear={actions.handleClearAnalytics}
          onRunSimulation={actions.runSimulation}
          onStopSimulation={actions.stopSimulation}
        />
      );
    if (activeScreen === "admin" && adminUnlocked)
      return (
        <AdminScreen
          onOpenAiLaboratory={() => setActiveScreen("laboratory")}
          onOpenGameAnalytics={() => setActiveScreen("gameAnalytics")}
          onLock={lockAdminMode}
          onBack={() => setActiveScreen("menu")}
        />
      );
    if (activeScreen === "settings") return <SettingsScreen />;
    if (activeScreen === "credits")
      return <CreditsScreen onBack={() => setActiveScreen("menu")} />;
    return (
      <>
        {gameState.gameOver && !simulation.active && showGameSummary && (
          <GameSummary
            players={gameState.players}
            winners={gameState.winners}
            gameLog={gameState.gameLog || []}
          />
        )}
        <GameBoard gameState={gameState} actions={actions} />
      </>
    );
  }
  return (
    <AppShell
      activeScreen={activeScreen}
      onNavigate={navigate}
      onAdminAccess={() =>
        adminUnlocked ? setActiveScreen("admin") : setShowAdminModal(true)
      }
      onSaveGame={actions.saveCurrentGame}
      saveStatus={saveStatus}
      canSaveGame={
        activeScreen === "game" &&
        gameActive &&
        !gameState.gameOver &&
        !simulation.active
      }
      simulationActive={simulation.active}
      savedGameAvailable={savedGameAvailable}
      adminUnlocked={adminUnlocked}
      showGameNavigation={gameActive || activeScreen === "onlineGame"}
      gameNavigationTarget={
        activeScreen === "onlineGame" ? "onlineGame" : "game"
      }
      welcomeName={
        onlineUser?.displayName ||
        onlineUser?.name ||
        onlineUser?.userName ||
        "Not Signed In"
      }
      welcomeRole={
        activeScreen === "onlineGame"
          ? activeOnlineRole
            ? activeOnlineRole.charAt(0).toUpperCase() +
              activeOnlineRole.slice(1)
            : ""
          : activeScreen === "game"
            ? "Player"
            : ""
      }
    >
      <SoundDirector
        activeScreen={activeScreen}
        gameState={gameState}
        simulationActive={simulation.active}
      />
      {renderScreen()}
      {showAdminModal && (
        <AdminAccessModal
          onClose={() => setShowAdminModal(false)}
          onUnlocked={() => {
            setShowAdminModal(false);
            setActiveScreen("admin");
          }}
        />
      )}
    </AppShell>
  );
}
export default App;
