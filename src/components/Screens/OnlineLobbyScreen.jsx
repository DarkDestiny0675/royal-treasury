import { useCallback, useEffect, useState } from "react";
import { clearAuthSession } from "../../auth/authSession";
import { logoutAccount } from "../../services/authApi";
import {
  createOnlineRoom,
  joinOnlineRoom,
  leaveOnlineRoom,
  loadRooms,
} from "../../services/roomApi";
import "./OnlineLobbyScreen.css";

function OnlineLobbyScreen({ user, onBack, onOpenRoom }) {
  const [publicRooms, setPublicRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    roomName: `${user?.firstName || "Royal"}'s Treasury`,
    visibility: "public",
    maximumPlayers: 4,
    spectatorsAllowed: true,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshRooms = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const result = await loadRooms();
      setPublicRooms(result.publicRooms || []);
      setMyRooms(result.myRooms || []);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRooms();
    const timer = window.setInterval(() => refreshRooms(true), 5000);
    return () => window.clearInterval(timer);
  }, [refreshRooms]);

  async function createRoom(event) {
    event.preventDefault();
    try {
      const result = await createOnlineRoom(form);
      setShowCreate(false);
      await refreshRooms(true);
      onOpenRoom(result.room);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function join(room, asSpectator = false) {
    try {
      const result = await joinOnlineRoom(room.roomId, asSpectator);
      await refreshRooms(true);
      onOpenRoom(result.room);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function joinByCode(event) {
    event.preventDefault();
    try {
      const result = await joinOnlineRoom(roomCode.trim(), false);
      setRoomCode("");
      await refreshRooms(true);
      onOpenRoom(result.room);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function leave(roomId) {
    try {
      await leaveOnlineRoom(roomId);
      await refreshRooms(true);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function signOut() {
    try {
      await logoutAccount();
    } finally {
      clearAuthSession();
      onBack();
    }
  }

  return (
    <section className="online-lobby-screen">
      <header className="online-lobby-heading">
        <div>
          <p>Royal Treasury Online</p>
          <h1>The Great Hall</h1>
          <span>
            Welcome, {user?.displayName}. Choose a room or open your own
            treasury.
          </span>
        </div>
        <div className="online-lobby-heading-actions">
          <button onClick={() => refreshRooms()}>Refresh</button>
          <button onClick={signOut}>Sign Out</button>
        </div>
      </header>

      {message && (
        <div className="online-lobby-message" role="alert">
          {message}
        </div>
      )}

      <div className="online-lobby-toolbar">
        <button
          className="online-lobby-create"
          onClick={() => setShowCreate((current) => !current)}
        >
          {showCreate ? "Cancel Room" : "Create Room"}
        </button>
        <form className="online-lobby-code" onSubmit={joinByCode}>
          <label>
            <span>Private Room Code</span>
            <input
              value={roomCode}
              maxLength={6}
              onChange={(event) =>
                setRoomCode(event.target.value.toUpperCase())
              }
              placeholder="ABC123"
            />
          </label>
          <button disabled={roomCode.trim().length !== 6}>Join</button>
        </form>
      </div>

      {showCreate && (
        <form className="online-lobby-create-panel" onSubmit={createRoom}>
          <label>
            <span>Room Name</span>
            <input
              value={form.roomName}
              maxLength={40}
              onChange={(event) =>
                setForm({ ...form, roomName: event.target.value })
              }
              required
            />
          </label>
          <label>
            <span>Visibility</span>
            <select
              value={form.visibility}
              onChange={(event) =>
                setForm({ ...form, visibility: event.target.value })
              }
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label>
            <span>Player Seats</span>
            <select
              value={form.maximumPlayers}
              onChange={(event) =>
                setForm({ ...form, maximumPlayers: Number(event.target.value) })
              }
            >
              <option value={2}>2 players</option>
              <option value={3}>3 players</option>
              <option value={4}>4 players</option>
            </select>
          </label>
          <label className="online-lobby-checkbox">
            <input
              type="checkbox"
              checked={form.spectatorsAllowed}
              onChange={(event) =>
                setForm({ ...form, spectatorsAllowed: event.target.checked })
              }
            />
            <span>Allow spectators</span>
          </label>
          <button type="submit">Open Treasury</button>
        </form>
      )}

      {myRooms.length > 0 && (
        <section className="online-lobby-section">
          <div className="online-lobby-section-title">
            <h2>My Rooms</h2>
            <span>{myRooms.length}</span>
          </div>
          <div className="online-lobby-room-grid">
            {myRooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                currentUserId={user.userId}
                onJoin={() => onOpenRoom(room)}
                onSpectate={() => join(room, true)}
                onLeave={() => leave(room.roomId)}
                mine
              />
            ))}
          </div>
        </section>
      )}

      <section className="online-lobby-section">
        <div className="online-lobby-section-title">
          <h2>Public Rooms</h2>
          <span>{publicRooms.length}</span>
        </div>
        {loading ? (
          <div className="online-lobby-empty">Opening the Great Hall...</div>
        ) : publicRooms.length === 0 ? (
          <div className="online-lobby-empty">
            <strong>No public rooms are open.</strong>
            <span>Create the first room and invite friends or AI players.</span>
          </div>
        ) : (
          <div className="online-lobby-room-grid">
            {publicRooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                currentUserId={user.userId}
                onJoin={() => join(room, false)}
                onSpectate={() => join(room, true)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="online-lobby-footer">
        <button onClick={onBack}>Back to Menu</button>
      </div>
    </section>
  );
}

function RoomCard({
  room,
  currentUserId,
  onJoin,
  onSpectate,
  onLeave,
  mine = false,
}) {
  const openSeats = Math.max(0, room.maximumPlayers - room.playerCount);
  const isPlayer = room.players.some(
    (player) => player.userId === currentUserId,
  );
  return (
    <article className="online-room-card">
      <div className="online-room-card-top">
        <span className={`online-room-status ${room.status}`}>
          {room.status === "in_progress" ? "In Progress" : "Waiting"}
        </span>
        <span>{room.visibility === "private" ? "Private" : "Public"}</span>
      </div>
      <h3>{room.roomName}</h3>
      <p>Hosted by {room.hostDisplayName}</p>
      {mine && (
        <div className="online-room-code-line">
          Room Code <strong>{room.roomCode}</strong>
        </div>
      )}
      <div className="online-room-counts">
        <span>
          {room.playerCount}/{room.maximumPlayers} Players
        </span>
        <span>{room.spectatorCount} Spectators</span>
      </div>
      <div className="online-room-players">
        {room.players.map((player) => (
          <span key={player.roomMemberId}>
            {player.seatNumber}. {player.displayName}
          </span>
        ))}
        {Array.from({ length: openSeats }, (_, index) => (
          <span className="open" key={`open-${index}`}>
            Open Seat
          </span>
        ))}
      </div>
      <div className="online-room-actions">
        {mine || isPlayer ? (
          <button onClick={onJoin}>Open Room</button>
        ) : room.status === "waiting" && openSeats > 0 ? (
          <button onClick={onJoin}>Join Game</button>
        ) : null}
        {room.spectatorsAllowed && !mine && (
          <button className="secondary" onClick={onSpectate}>
            Spectate
          </button>
        )}
        {mine && (
          <button className="danger" onClick={onLeave}>
            Leave
          </button>
        )}
      </div>
    </article>
  );
}

export default OnlineLobbyScreen;
