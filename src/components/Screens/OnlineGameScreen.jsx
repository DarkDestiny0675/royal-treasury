import { useEffect, useState } from "react";
import GameSummary from "../Board/GameSummary";
import GameBoard from "../GameBoard/GameBoard";
import { useOnlineRoyalTreasuryGame } from "../../hooks/useOnlineRoyalTreasuryGame";
import "./OnlineGameScreen.css";

function OnlineGameScreen({ matchId, user, onRoleChange, onExit }) {
  const game = useOnlineRoyalTreasuryGame(matchId, user);
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);
  const [showEndMatch, setShowEndMatch] = useState(false);
  useEffect(() => {
    if (game.role) onRoleChange?.(game.role);
  }, [game.role, onRoleChange]);

  async function completeLeave(mode) {
    const left = await game.leaveMatch(mode);
    if (left) onExit();
  }

  async function completeSpectatorExit() {
    const left = await game.stopSpectating();
    if (left) onExit();
  }

  async function completeEndMatch() {
    const ended = await game.endMatch();
    if (ended) onExit();
  }

  if (!game.gameState) {
    return <section className="online-game-loading">{game.message}</section>;
  }

  const showGameSummary =
    game.gameState.gameOver &&
    Array.isArray(game.gameState.winners) &&
    game.gameState.winners.length > 0;

  return (
    <section className="online-game-screen">
      <header>
        <div>
          <p>Royal Treasury Online</p>
          <h1>{game.role === "spectator" ? "Spectating Match" : "Live Match"}</h1>
          <span>{game.gameState.message}</span>
        </div>
        <div>
          <b>{game.role}</b>
          <button onClick={game.refresh}>Sync</button>
          {game.role === "host" && !game.gameState.gameOver && (
            <button onClick={() => setShowEndMatch(true)}>End Match</button>
          )}
          <button onClick={onExit}>Lobby</button>
        </div>
      </header>

      {game.message && <div className="online-game-message">{game.message}</div>}

      {showGameSummary && (
        <GameSummary
          players={game.gameState.players}
          winners={game.gameState.winners}
          gameLog={game.gameState.gameLog || []}
        />
      )}

      <GameBoard
        gameState={game.gameState}
        actions={game.actions}
        currentUserId={user?.userId}
        readOnly={!game.canAct}
        onLeaveMatch={game.role === "spectator" ? null : () => setShowLeaveOptions(true)}
        leaveMatchBusy={game.leaving}
        spectatorMode={game.role === "spectator"}
        onStopSpectating={() => setShowLeaveOptions(true)}
      />


      {showLeaveOptions && (
        <div className="online-leave-overlay" role="presentation">
          <section
            className="online-leave-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-match-title"
          >
            {game.role === "spectator" ? (
              <>
                <h2 id="leave-match-title">Stop Spectating?</h2>
                <p>You will leave spectator mode and return to the Online Lobby.</p>
                <button
                  type="button"
                  onClick={() => setShowLeaveOptions(false)}
                  disabled={game.leaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={completeSpectatorExit}
                  disabled={game.leaving}
                >
                  {game.leaving ? "Leaving..." : "Stop Spectating"}
                </button>
              </>
            ) : (
              <>
                <h2 id="leave-match-title">Leave Match</h2>
                <p>Your online progress is already saved.</p>
                <button
                  type="button"
                  onClick={() => setShowLeaveOptions(false)}
                  disabled={game.leaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => completeLeave("temporary")}
                  disabled={game.leaving}
                >
                  Leave Temporarily
                </button>
                <button
                  type="button"
                  onClick={() => completeLeave("replaceWithAi")}
                  disabled={game.leaving}
                >
                  Replace Me with Random AI
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {showEndMatch && (
        <div className="online-leave-overlay" role="presentation">
          <section
            className="online-leave-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-match-title"
          >
            <h2 id="end-match-title">End Match?</h2>
            <p>
              This game will be abandoned. No winner, player statistics, AI statistics,
              or match-history result will be recorded.
            </p>
            <button
              type="button"
              onClick={() => setShowEndMatch(false)}
              disabled={game.leaving}
            >
              Cancel
            </button>
            <button type="button" onClick={completeEndMatch} disabled={game.leaving}>
              {game.leaving ? "Ending..." : "End Match"}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

export default OnlineGameScreen;
