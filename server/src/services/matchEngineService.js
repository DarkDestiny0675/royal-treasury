import crypto from "node:crypto";
import { getDatabase } from "../database/database.js";
import { generateCardDeck } from "./generateCardDeck.js";
import { generateNoblePool } from "./generateNoblePool.js";

const COLORS = ["white", "blue", "green", "red", "black"];

const AI_NAMES = {
  builder: [
    "Aldric Mason",
    "Bram Stonewright",
    "Cedric Forgehand",
    "Dorian Archwright",
    "Garrick Stronghold",
  ],
  investor: [
    "Cassian Goldwell",
    "Edmund Sterling",
    "Lucian Fairmont",
    "Octavian Crowne",
    "Silas Worthington",
  ],
  nobleHunter: [
    "Beatrice Courtly",
    "Eleanor Highcrest",
    "Isolde Rosecourt",
    "Rosalind Grace",
    "Vivienne Nobleheart",
  ],
  finisher: [
    "Alaric Swift",
    "Corvin Laststrike",
    "Leona Victory",
    "Ronan Endgame",
    "Valeria Triumph",
  ],
};
function aiDisplayName(personalityId, memberId) {
  const names = AI_NAMES[personalityId] || ["Royal Contender"];
  let hash = 0;
  for (const char of String(memberId || personalityId))
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const fullName = names[hash % names.length];
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0];
}

const ALL_TOKEN_COLORS = [...COLORS, "gold"];
const addLog = (state, player, action) => {
  if (!Array.isArray(state.gameLog)) state.gameLog = [];
  state.gameLog.push({
    id: crypto.randomUUID(),
    turn: (state.turnCount || 0) + 1,
    playerName: player?.name || "Royal Treasury",
    personality: player?.type === "ai" ? player.personalityId || "AI" : "Human",
    action,
  });
};
const emptyTokens = () => ({
  white: 0,
  blue: 0,
  green: 0,
  red: 0,
  black: 0,
  gold: 0,
});
const tokenTotal = (player) =>
  Object.values(player.tokens).reduce((total, count) => total + count, 0);
const shuffle = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

function discounts(player) {
  const result = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
  player.purchasedCards.forEach((purchasedCard) => {
    result[purchasedCard.bonusColor] += 1;
  });
  return result;
}
function payment(player, target) {
  const playerDiscounts = discounts(player);
  const spent = emptyTokens();
  let gold = 0;
  for (const color of COLORS) {
    const due = Math.max(
      0,
      (target.costs[color] || 0) - playerDiscounts[color],
    );
    spent[color] = Math.min(player.tokens[color] || 0, due);
    gold += due - spent[color];
  }
  spent.gold = gold;
  return { canAfford: gold <= (player.tokens.gold || 0), spent };
}
function winners(players) {
  const highestPoints = Math.max(...players.map((player) => player.points));
  const leaders = players.filter((player) => player.points === highestPoints);
  const fewestCards = Math.min(
    ...leaders.map((player) => player.purchasedCards.length),
  );
  return leaders.filter(
    (player) => player.purchasedCards.length === fewestCards,
  );
}
function finish(state) {
  state.turnCount += 1;
  const nextPlayer = (state.currentPlayer + 1) % state.players.length;
  if (
    state.finalRoundTriggered &&
    nextPlayer === state.finalRoundStartingPlayer
  ) {
    state.gameOver = true;
    state.winners = winners(state.players);
  }
  state.currentPlayer = nextPlayer;
  state.selectedTokens = [];
  state.exchangePending = false;
  state.mustDiscardAfterReserve = false;
  state.stateVersion += 1;
  if (state.gameOver && state.winners.length > 0) {
    addLog(
      state,
      state.winners[0],
      `${state.winners.map((winner) => winner.name).join(" & ")} won the game.`,
    );
  }
  state.message = state.gameOver
    ? `${state.winners.map((winner) => winner.name).join(" & ")} WON!`
    : `${state.players[nextPlayer].name}'s Turn`;
}
function marketKeys(tier) {
  return { market: `tier${tier}Market`, deck: `tier${tier}Deck` };
}
function refill(state, tier) {
  const keys = marketKeys(tier);
  if (state[keys.deck].length)
    state[keys.market].push(state[keys.deck].shift());
}
function buildPlayer(member) {
  return {
    id: member.room_member_id,
    userId: member.user_id,
    type: member.member_type,
    name:
      member.display_name ||
      aiDisplayName(member.ai_personality_id, member.room_member_id),
    personalityId: member.ai_personality_id,
    points: 0,
    tokens: emptyTokens(),
    purchasedCards: [],
    reservedCards: [],
    nobles: [],
  };
}

export function createInitialMatchState(roomId) {
  const database = getDatabase();
  const room = database
    .prepare("SELECT * FROM rooms WHERE room_id = ?")
    .get(roomId);
  const members = database
    .prepare(
      `SELECT rm.*, CASE WHEN u.user_id IS NULL THEN NULL ELSE u.first_name || ' ' || UPPER(SUBSTR(u.last_name, 1, 1)) || '.' END display_name FROM room_members rm LEFT JOIN users u ON u.user_id = rm.user_id WHERE rm.room_id = ? AND rm.role <> 'spectator' ORDER BY rm.seat_number`,
    )
    .all(roomId);
  const tier1Deck = shuffle(generateCardDeck(1));
  const tier2Deck = shuffle(generateCardDeck(2));
  const tier3Deck = shuffle(generateCardDeck(3));
  const noblePool = generateNoblePool();
  const players = members.map(buildPlayer);
  const regularGemCount =
    players.length === 2 ? 4 : players.length === 3 ? 5 : 7;
  return {
    stateVersion: 1,
    roomId,
    victoryTarget: room.victory_target || 20,
    players,
    currentPlayer: 0,
    selectedTokens: [],
    exchangePending: false,
    mustDiscardAfterReserve: false,
    tier1Market: tier1Deck.splice(0, 4),
    tier2Market: tier2Deck.splice(0, 4),
    tier3Market: tier3Deck.splice(0, 4),
    tier1Deck,
    tier2Deck,
    tier3Deck,
    availableNobles: noblePool.slice(0, players.length + 1),
    bank: {
      white: regularGemCount,
      blue: regularGemCount,
      green: regularGemCount,
      red: regularGemCount,
      black: regularGemCount,
      gold: 5,
    },
    turnCount: 0,
    finalRoundTriggered: false,
    finalRoundStartingPlayer: null,
    gameOver: false,
    winners: [],
    gameLog: [],
    message: `${players[0].name}'s Turn`,
  };
}

function collect(state, color) {
  if (
    !COLORS.includes(color) ||
    state.bank[color] <= 0 ||
    state.mustDiscardAfterReserve
  )
    return false;
  const player = state.players[state.currentPlayer];
  const selected = state.selectedTokens;
  const pendingTotal = tokenTotal(player) + selected.length;

  if (pendingTotal >= 10 || selected.length >= 3) return false;

  if (state.exchangePending) {
    if (selected.length >= 1) return false;
    state.bank[color] -= 1;
    selected.push(color);
    state.stateVersion += 1;
    state.message = `${player.name} selected a replacement token.`;
    return true;
  }

  if (selected.length === 1 && selected[0] === color && state.bank[color] < 3)
    return false;
  if (
    selected.length >= 2 &&
    (selected.includes(color) || new Set(selected).size !== selected.length)
  )
    return false;

  state.bank[color] -= 1;
  selected.push(color);
  state.stateVersion += 1;
  return true;
}

function returnGem(state, color) {
  if (!ALL_TOKEN_COLORS.includes(color)) return false;
  const player = state.players[state.currentPlayer];
  const selectedIndex = state.selectedTokens.indexOf(color);
  if (selectedIndex >= 0 && !state.mustDiscardAfterReserve) {
    state.selectedTokens.splice(selectedIndex, 1);
    state.bank[color] += 1;
    state.stateVersion += 1;
    return true;
  }
  if (
    player.tokens[color] <= 0 ||
    state.selectedTokens.length > 0 ||
    state.exchangePending
  )
    return false;
  const totalBeforeReturn = tokenTotal(player);
  player.tokens[color] -= 1;
  state.bank[color] += 1;
  state.stateVersion += 1;

  if (state.mustDiscardAfterReserve || totalBeforeReturn > 10) {
    state.mustDiscardAfterReserve = tokenTotal(player) > 10;
    state.exchangePending = false;
    state.message = state.mustDiscardAfterReserve
      ? `${player.name} must return ${tokenTotal(player) - 10} more token(s).`
      : `${player.name} returned to the 10-token limit and may confirm the turn.`;
    return true;
  }

  state.exchangePending = true;
  state.message = `${player.name} returned a token and must select one replacement.`;
  return true;
}

function confirm(state) {
  const player = state.players[state.currentPlayer];
  const selected = state.selectedTokens;
  const pendingTotal = tokenTotal(player) + selected.length;

  if (state.mustDiscardAfterReserve || pendingTotal > 10) return false;

  if (
    !state.exchangePending &&
    selected.length === 0 &&
    tokenTotal(player) === 10 &&
    state.message?.includes("returned to the 10-token limit")
  ) {
    finish(state);
    return true;
  }

  const exchangeComplete = state.exchangePending && selected.length === 1;
  const selectedDistinctColors = new Set(selected);
  const selectableStandardColors = COLORS.filter(
    (color) => state.bank[color] > 0,
  );
  const noAdditionalDistinctGemAvailable =
    selected.length > 0 &&
    selectedDistinctColors.size === selected.length &&
    selectableStandardColors.every((color) =>
      selectedDistinctColors.has(color),
    );
  const standardSelectionComplete =
    (selected.length === 2 && selected[0] === selected[1]) ||
    (selected.length === 3 && selectedDistinctColors.size === 3) ||
    (!state.exchangePending && selected.length > 0 && pendingTotal === 10) ||
    (!state.exchangePending && noAdditionalDistinctGemAvailable);

  if (!exchangeComplete && !standardSelectionComplete) return false;

  const collected = [...selected];
  selected.forEach((color) => {
    player.tokens[color] += 1;
  });
  addLog(state, player, `${player.name} collected ${collected.join(", ")}.`);
  finish(state);
  return true;
}

function buy(state, cardId, tier, reserved = false) {
  if (state.exchangePending || state.mustDiscardAfterReserve) return false;
  const player = state.players[state.currentPlayer],
    keys = marketKeys(tier);
  const list = reserved ? player.reservedCards : state[keys.market];
  const target = list.find((candidate) => candidate.id === cardId);
  if (!target || state.selectedTokens.length) return false;
  const cardPayment = payment(player, target);
  if (!cardPayment.canAfford) return false;
  Object.keys(cardPayment.spent).forEach((color) => {
    player.tokens[color] -= cardPayment.spent[color];
    state.bank[color] += cardPayment.spent[color];
  });
  player.purchasedCards.push(target);
  player.points += target.points;
  if (reserved)
    player.reservedCards = player.reservedCards.filter(
      (candidate) => candidate.id !== cardId,
    );
  else {
    state[keys.market] = state[keys.market].filter(
      (candidate) => candidate.id !== cardId,
    );
    refill(state, tier);
  }
  if (player.points >= state.victoryTarget && !state.finalRoundTriggered) {
    state.finalRoundTriggered = true;
    state.finalRoundStartingPlayer = state.currentPlayer;
  }
  addLog(
    state,
    player,
    reserved
      ? `${player.name} purchased reserved card ${target.title || "card"}.`
      : `${player.name} purchased ${target.title || "a market card"}.`,
  );
  finish(state);
  return true;
}

function reserve(state, cardId, tier) {
  if (state.exchangePending || state.mustDiscardAfterReserve) return false;
  const player = state.players[state.currentPlayer],
    keys = marketKeys(tier);
  const target = state[keys.market].find(
    (candidate) => candidate.id === cardId,
  );
  if (
    !target ||
    player.reservedCards.length >= 3 ||
    state.selectedTokens.length
  )
    return false;
  player.reservedCards.push({ ...target, reservedFromTier: tier });
  state[keys.market] = state[keys.market].filter(
    (candidate) => candidate.id !== cardId,
  );
  if (state.bank.gold > 0) {
    state.bank.gold -= 1;
    player.tokens.gold += 1;
  }
  refill(state, tier);
  addLog(
    state,
    player,
    `${player.name} reserved ${target.title || "a market card"}.`,
  );
  if (tokenTotal(player) > 10) {
    state.mustDiscardAfterReserve = true;
    state.stateVersion += 1;
    state.message = `${player.name} reserved a card and must return ${tokenTotal(player) - 10} token(s).`;
  } else {
    finish(state);
  }
  return true;
}

function claimNoble(state, nobleId) {
  if (
    state.exchangePending ||
    state.mustDiscardAfterReserve ||
    state.selectedTokens.length
  )
    return false;
  const player = state.players[state.currentPlayer];
  const noble = state.availableNobles.find(
    (candidate) => candidate.id === nobleId,
  );
  if (!noble) return false;
  const playerDiscounts = discounts(player);
  const qualifies = Object.entries(
    noble.requirements || noble.costs || {},
  ).every(
    ([color, requirement]) => (playerDiscounts[color] || 0) >= requirement,
  );
  if (!qualifies) return false;
  player.nobles.push(noble);
  player.points += noble.points;
  state.availableNobles = state.availableNobles.filter(
    (candidate) => candidate.id !== noble.id,
  );
  if (player.points >= state.victoryTarget && !state.finalRoundTriggered) {
    state.finalRoundTriggered = true;
    state.finalRoundStartingPlayer = state.currentPlayer;
  }
  addLog(state, player, `${player.name} claimed ${noble.name || "a Noble"}.`);
  state.stateVersion += 1;
  state.message = `${player.name} claimed ${noble.name}.`;
  return true;
}

function aiTurn(state) {
  const player = state.players[state.currentPlayer];
  for (const tier of [3, 2, 1]) {
    const keys = marketKeys(tier),
      target = state[keys.market].find(
        (candidate) => payment(player, candidate).canAfford,
      );
    if (target) {
      buy(state, target.id, tier, false);
      return;
    }
  }
  const remainingCapacity = Math.max(0, 10 - tokenTotal(player));
  const choices = COLORS.filter((color) => state.bank[color] > 0).slice(
    0,
    Math.min(3, remainingCapacity),
  );
  choices.forEach((color) => {
    state.bank[color] -= 1;
    player.tokens[color] += 1;
  });
  addLog(
    state,
    player,
    choices.length
      ? `${player.name} collected ${choices.join(", ")}.`
      : `${player.name} passed.`,
  );
  finish(state);
}

export function advanceAiTurns(state) {
  while (!state.gameOver && state.players[state.currentPlayer]?.type === "ai") {
    aiTurn(state);
  }
  return state;
}

export function applyMatchCommand(state, command) {
  state.exchangePending = Boolean(state.exchangePending);
  state.mustDiscardAfterReserve = Boolean(state.mustDiscardAfterReserve);
  const before = state.stateVersion;
  let accepted = false;
  if (command.type === "collectGem") accepted = collect(state, command.color);
  else if (command.type === "returnGem")
    accepted = returnGem(state, command.color);
  else if (command.type === "confirmGems") accepted = confirm(state);
  else if (command.type === "purchaseMarket")
    accepted = buy(state, command.cardId, Number(command.tier));
  else if (command.type === "reserveMarket")
    accepted = reserve(state, command.cardId, Number(command.tier));
  else if (command.type === "purchaseReserved")
    accepted = buy(state, command.cardId, Number(command.tier), true);
  else if (command.type === "claimNoble")
    accepted = claimNoble(state, command.nobleId);
  if (!accepted || state.stateVersion === before)
    throw new Error("That action is not legal in the current game state.");
  advanceAiTurns(state);
  return state;
}
