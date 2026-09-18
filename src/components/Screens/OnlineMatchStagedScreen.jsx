import { useState } from "react";
import RandomSeatingScreen from "./RandomSeatingScreen";
import GameCountdownScreen from "./GameCountdownScreen";
import "./OnlineMatchStagedScreen.css";

function OnlineMatchStagedScreen({ room, matchId, onEnter, onBack }) {
  const [stage, setStage] = useState("seating");
  const players = [...(room?.players || [])].sort(
    (left, right) => left.seatNumber - right.seatNumber,
  ).map((player) => ({
    id: player.roomMemberId,
    name: player.displayName,
    type: player.memberType,
  }));

  if (stage === "seating") {
    return (
      <RandomSeatingScreen
        entrants={players}
        players={players}
        onComplete={() => setStage("countdown")}
      />
    );
  }

  if (stage === "countdown") {
    return (
      <GameCountdownScreen
        firstPlayer={players[0]}
        onComplete={onEnter}
      />
    );
  }

  return null;
}

export default OnlineMatchStagedScreen;
