import { createPlayer } from "./playerFactory";
import { generateCardDeck } from "./generateCardDeck";
import { generateNoblePool } from "./generateNoblePool";
import { getRandomAiNames } from "./getRandomAiNames";
import { shuffleDeck } from "./shuffleDeck";
import { chooseAiPersonality } from "./ai/chooseAiPersonality";

const DEFAULT_OPTIONS = { sessionName: "Royal Treasury Match", playerCount: 4, victoryTarget: 20, tier1Cards: 40, tier2Cards: 30, tier3Cards: 20 };
function clamp(value, min, max, fallback) { return Math.min(max, Math.max(min, Number(value) || fallback)); }
export function createGame(options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const playerCount = clamp(settings.playerCount, 2, 4, 4);
  const victoryTarget = clamp(settings.victoryTarget, 15, 30, 20);
  const tier1Cards = clamp(settings.tier1Cards, 24, 40, 40);
  const tier2Cards = clamp(settings.tier2Cards, 18, 30, 30);
  const tier3Cards = clamp(settings.tier3Cards, 12, 20, 20);
  const sessionName = String(settings.sessionName || "Royal Treasury Match").trim() || "Royal Treasury Match";
  const tier1 = shuffleDeck(generateCardDeck(1));
  const tier2 = shuffleDeck(generateCardDeck(2));
  const tier3 = shuffleDeck(generateCardDeck(3));
  const nobles = shuffleDeck(generateNoblePool());
  const configuredSeats = Array.isArray(settings.seats) ? settings.seats.slice(0, playerCount) : Array.from({ length: playerCount }, (_, index) => ({ type: index === 0 ? "human" : "ai", name: index === 0 ? "Michael" : "", profileId: null }));
  const aiNames = getRandomAiNames(configuredSeats.filter((seat) => seat.type === "ai").length);
  let aiIndex = 0;
  const configuredPlayers = configuredSeats.map((seat, index) => {
    const isAi = seat.type === "ai";
    const name = isAi ? aiNames[aiIndex++] : String(seat.name || `Player ${index + 1}`).trim() || `Player ${index + 1}`;
    return { ...createPlayer(name), type: isAi ? "ai" : "human", profileId: isAi ? null : seat.profileId || null, personality: isAi ? chooseAiPersonality() : "Human" };
  });
  const seatingEntrants = configuredPlayers.map((player) => ({ id: player.id, name: player.name, type: player.type, profileId: player.profileId }));
  const players = settings.randomizeSeating === false ? configuredPlayers : shuffleDeck([...configuredPlayers]);
  const firstPlayer = players[0];
  const firstPlayerIsAi = firstPlayer.type === "ai";
  return {
    options: { sessionName, playerCount, victoryTarget, tier1Cards, tier2Cards, tier3Cards, randomizeSeating: settings.randomizeSeating !== false },
    victoryTarget,
    tier1Market: tier1.slice(0, 4), tier2Market: tier2.slice(0, 4), tier3Market: tier3.slice(0, 4),
    tier1Deck: tier1.slice(4, tier1Cards), tier2Deck: tier2.slice(4, tier2Cards), tier3Deck: tier3.slice(4, tier3Cards),
    availableNobles: nobles.slice(0, playerCount + 1),
    bank: { white: playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7, blue: playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7, green: playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7, red: playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7, black: playerCount === 2 ? 4 : playerCount === 3 ? 5 : 7, gold: 5 },
    seatingEntrants, players, currentPlayer: 0, selectedTokens: [], actionMode: "threeDifferent", cardAction: "purchase", actionsRemaining: 1, finalRoundTriggered: false, finalRoundStartingPlayer: null, gameOver: false, winners: [], aiThinking: firstPlayerIsAi, aiMessage: firstPlayerIsAi ? `${firstPlayer.name} is thinking...` : `${firstPlayer.name}'s Turn`, turnCount: 0, gameLog: [],
  };
}
