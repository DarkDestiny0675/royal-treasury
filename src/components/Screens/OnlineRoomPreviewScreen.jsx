import "./OnlineRoomPreviewScreen.css";

function OnlineRoomPreviewScreen({ room, user, onBack }) {
  if (!room) return null;
  return <section className="online-room-preview-screen">
    <header className="online-room-preview-heading"><p>{room.visibility} room</p><h1>{room.roomName}</h1><span>Hosted by {room.hostDisplayName}</span></header>
    <div className="online-room-preview-body">
      <section><h2>Players</h2>{room.players.map((player) => <div className="online-room-preview-person" key={player.roomMemberId}><span>Seat {player.seatNumber}</span><strong>{player.displayName}</strong>{player.userId === user?.userId && <em>You</em>}</div>)}{Array.from({ length: Math.max(0, room.maximumPlayers - room.playerCount) }, (_, index) => <div className="online-room-preview-person open" key={index}><span>Open Seat</span><strong>Waiting for a player</strong></div>)}</section>
      <aside><span>Room Code</span><strong>{room.roomCode}</strong><p>Room configuration, AI seat selection, ready status, and starting the match arrive in Phase 6.</p></aside>
    </div>
    <div className="online-room-preview-actions"><button onClick={onBack}>Back to Lobby</button></div>
  </section>;
}
export default OnlineRoomPreviewScreen;
