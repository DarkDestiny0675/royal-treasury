import { useEffect, useState } from "react";
import {
  savePlayerProfile,
  usePlayerProfile,
} from "../../settings/playerProfileStore";
import "./GameSetupScreen.css";

const AI_SEAT = { type: "ai", name: "", profileId: null };

function createSeats(profile) {
  return [
    { type: "human", name: profile.displayName, profileId: profile.id },
    AI_SEAT,
    AI_SEAT,
    AI_SEAT,
  ];
}

function GameSetupScreen({ onStart, onBack }) {
  const profile = usePlayerProfile();
  const [sessionName, setSessionName] = useState("Royal Treasury Match");
  const [playerCount, setPlayerCount] = useState(4);
  const [seats, setSeats] = useState(() => createSeats(profile));
  const [victoryTarget, setVictoryTarget] = useState(20);
  const [tier1Cards, setTier1Cards] = useState(40);
  const [tier2Cards, setTier2Cards] = useState(30);
  const [tier3Cards, setTier3Cards] = useState(20);

  useEffect(() => {
    setSeats((current) =>
      current.map((seat, index) =>
        index === 0
          ? {
              ...seat,
              name: profile.displayName,
              profileId: profile.id,
            }
          : seat,
      ),
    );
  }, [profile.displayName, profile.id]);

  function updateSeat(index, field, value) {
    setSeats((current) =>
      current.map((seat, seatIndex) =>
        seatIndex === index ? { ...seat, [field]: value } : seat,
      ),
    );
  }

  function submit(event) {
    event.preventDefault();

    const localName =
      String(seats[0].name || profile.displayName).trim() ||
      profile.displayName;
    const updatedProfile = savePlayerProfile({
      ...profile,
      displayName: localName,
    });
    const configuredSeats = seats
      .slice(0, playerCount)
      .map((seat, index) =>
        index === 0 && seat.type === "human"
          ? {
              ...seat,
              name: updatedProfile.displayName,
              profileId: updatedProfile.id,
            }
          : seat,
      );

    onStart({
      sessionName: sessionName.trim() || "Royal Treasury Match",
      playerCount,
      seats: configuredSeats,
      victoryTarget,
      tier1Cards,
      tier2Cards,
      tier3Cards,
      randomizeSeating: true,
    });
  }

  const activeSeats = seats.slice(0, playerCount);

  return (
    <form className="game-setup-screen" onSubmit={submit}>
      <header className="game-setup-heading">
        <p>New Match</p>
        <h1>Prepare the Treasury</h1>
        <span>
          The first human seat is the active local player profile for this
          device.
        </span>
      </header>

      <div className="game-setup-layout">
        <section className="game-setup-card">
          <h2>Match Configuration</h2>
          <Control label="Session Name">
            <input
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
            />
          </Control>
          <Control label="Players">
            <select
              value={playerCount}
              onChange={(event) => setPlayerCount(Number(event.target.value))}
            >
              <option value={2}>2 players</option>
              <option value={3}>3 players</option>
              <option value={4}>4 players</option>
            </select>
          </Control>
          <Control label="Victory Target">
            <select
              value={victoryTarget}
              onChange={(event) =>
                setVictoryTarget(Number(event.target.value))
              }
            >
              {[15, 20, 25, 30].map((value) => (
                <option key={value} value={value}>
                  {value} points
                </option>
              ))}
            </select>
          </Control>
          <Tier
            label="Tier 1 Deck"
            value={tier1Cards}
            setValue={setTier1Cards}
            options={[24, 28, 32, 36, 40]}
          />
          <Tier
            label="Tier 2 Deck"
            value={tier2Cards}
            setValue={setTier2Cards}
            options={[18, 22, 26, 30]}
          />
          <Tier
            label="Tier 3 Deck"
            value={tier3Cards}
            setValue={setTier3Cards}
            options={[12, 16, 20]}
          />
        </section>

        <section className="game-setup-card">
          <h2>Player Roster</h2>
          {activeSeats.map((seat, index) => (
            <div className="game-setup-seat" key={index}>
              <span>{index === 0 ? "Local Player" : `Player ${index + 1}`}</span>
              <select
                value={seat.type}
                onChange={(event) =>
                  updateSeat(index, "type", event.target.value)
                }
                disabled={index === 0}
              >
                <option value="human">Human</option>
                <option value="ai">AI</option>
              </select>
              {seat.type === "human" ? (
                <input
                  value={seat.name}
                  placeholder={`Player ${index + 1}`}
                  onChange={(event) =>
                    updateSeat(index, "name", event.target.value)
                  }
                />
              ) : (
                <em>Random name and personality</em>
              )}
            </div>
          ))}
          <div className="game-setup-profile-note">
            <strong>Private Player Profile</strong>
            <span>
              Completed matches are recorded only for{" "}
              {seats[0].name || profile.displayName} on this device.
            </span>
          </div>
        </section>
      </div>

      <div className="game-setup-actions">
        <button
          type="button"
          className="game-setup-secondary-action"
          onClick={onBack}
        >
          Back
        </button>
        <button type="submit" className="game-setup-primary-action">
          Generate Royal Seating
        </button>
      </div>
    </form>
  );
}

function Control({ label, children }) {
  return (
    <label className="game-setup-control">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Tier({ label, value, setValue, options }) {
  return (
    <Control label={label}>
      <select
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option} cards
          </option>
        ))}
      </select>
    </Control>
  );
}

export default GameSetupScreen;
