import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addRoomAi,
  loadOnlineRoom,
  removeRoomAi,
  removeRoomPlayer,
  saveRoomSettings,
  setPlayerReady,
  startOnlineMatch,
  transferRoomHost,
} from "../../services/roomManagementApi";
import "./OnlineWaitingRoomScreen.css";

function OnlineWaitingRoomScreen({ initialRoom, user, onBack, onMatchStaged }) {
  const [room, setRoom] = useState(initialRoom),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setRoom((await loadOnlineRoom(initialRoom.roomId)).room);
    } catch (error) {
      setMessage(error.message);
    }
  }, [initialRoom.roomId]);
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (room && room.status === "in_progress" && room.activeMatchId) {
      onMatchStaged({
        room,
        matchId: room.activeMatchId,
      });
    }
  }, [room, onMatchStaged]);
  const me = room?.players.find((p) => p.userId === user?.userId),
    host = room?.hostUserId === user?.userId,
    seats = useMemo(
      () =>
        Array.from(
          { length: room?.maximumPlayers || 0 },
          (_, i) => room?.players.find((p) => p.seatNumber === i + 1) || null,
        ),
      [room],
    );
  const canStart =
    host &&
    room?.players.length >= 2 &&
    room.players
      .filter((p) => p.memberType === "human")
      .every((p) => p.isReady) &&
    room.status === "waiting";
  async function run(action) {
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      if (result?.room) setRoom(result.room);
      return result;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    const result = await run(() => startOnlineMatch(room.roomId));
    if (result) onMatchStaged(result);
  }
  return (
    <section className="online-waiting-room">
      <header className="online-waiting-heading">
        <div>
          <p>{room.visibility} room</p>
          <h1>{room.roomName}</h1>
          <span>Hosted by {room.hostDisplayName}</span>
        </div>
        <div className="online-waiting-code">
          <span>Room Code</span>
          <strong>{room.roomCode}</strong>
        </div>
      </header>
      {message && <div className="online-waiting-message">{message}</div>}
      <div className="online-waiting-layout">
        <main className="online-waiting-seats">
          <h2>
            Player Seats {room.playerCount}/{room.maximumPlayers}
          </h2>
          {seats.map((player, index) => (
            <article className="online-waiting-seat" key={index}>
              <span>Seat {index + 1}</span>
              {player ? (
                <>
                  <div>
                    <strong>{player.displayName}</strong>
                    <small>
                      {player.memberType === "ai"
                        ? `${player.aiPersonalityId} AI`
                        : player.role === "host"
                          ? "Room Host"
                          : "Human Player"}
                    </small>
                  </div>
                  <b className={player.isReady ? "ready" : "not-ready"}>
                    {player.isReady ? "Ready" : "Not Ready"}
                  </b>
                  {host && player.memberType === "ai" && (
                    <button
                      onClick={() =>
                        run(() =>
                          removeRoomAi(room.roomId, player.roomMemberId),
                        )
                      }
                    >
                      Remove AI
                    </button>
                  )}
                  {host &&
                    player.memberType === "human" &&
                    player.userId !== user.userId && (
                      <div className="seat-actions">
                        <button
                          onClick={() =>
                            run(() =>
                              transferRoomHost(
                                room.roomId,
                                player.roomMemberId,
                              ),
                            )
                          }
                        >
                          Make Host
                        </button>
                        <button
                          onClick={() =>
                            run(() =>
                              removeRoomPlayer(
                                room.roomId,
                                player.roomMemberId,
                              ),
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )}
                </>
              ) : (
                <>
                  <div>
                    <strong>Open Seat</strong>
                    <small>Waiting for a player</small>
                  </div>
                  {host && (
                    <div className="seat-actions">
                      <button onClick={() => run(() => addRoomAi(room.roomId))}>
                        Add Random AI
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
        </main>
        <aside className="online-waiting-controls">
          <h2>Match Settings</h2>
          <label>
            Victory Target
            <select
              value={room.victoryTarget}
              disabled={!host || busy}
              onChange={(e) =>
                run(() =>
                  saveRoomSettings(room.roomId, {
                    victoryTarget: Number(e.target.value),
                    spectatorsAllowed: room.spectatorsAllowed,
                  }),
                )
              }
            >
              {[15, 20, 25, 30].map((v) => (
                <option key={v} value={v}>
                  {v} Prestige
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={room.spectatorsAllowed}
              disabled={!host || busy}
              onChange={(e) =>
                run(() =>
                  saveRoomSettings(room.roomId, {
                    victoryTarget: room.victoryTarget,
                    spectatorsAllowed: e.target.checked,
                  }),
                )
              }
            />
            Allow spectators
          </label>
          {me && room.status === "waiting" && (
            <button
              className="ready-button"
              onClick={() =>
                run(() => setPlayerReady(room.roomId, !me.isReady))
              }
            >
              {me.isReady ? "Mark Not Ready" : "I Am Ready"}
            </button>
          )}
          {host && (
            <button
              className="start-button"
              disabled={!canStart || busy}
              onClick={start}
            >
              Start Match
            </button>
          )}
          {host && !canStart && (
            <p>
              At least two occupied seats and every human player must be ready.
            </p>
          )}
        </aside>
      </div>
      {room.spectators.length > 0 && (
        <div className="online-spectators">
          <strong>Spectators</strong>
          {room.spectators.map((s) => (
            <span key={s.roomMemberId}>{s.displayName}</span>
          ))}
        </div>
      )}
      <footer>
        <button onClick={onBack}>Back to Lobby</button>
        <button onClick={refresh}>Refresh Room</button>
      </footer>
    </section>
  );
}
export default OnlineWaitingRoomScreen;
