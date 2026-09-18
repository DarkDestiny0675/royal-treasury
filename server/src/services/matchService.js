import crypto from "node:crypto";
import { getDatabase } from "../database/database.js";
import {
  advanceAiTurns,
  applyMatchCommand,
  createInitialMatchState,
} from "./matchEngineService.js";

function parseStoredGameState(text) {
  try {
    const state = JSON.parse(text);
    return state && Array.isArray(state.players) ? state : null;
  } catch {
    return null;
  }
}

export function initializeMatch(matchId, roomId) {
  const database = getDatabase();
  const state = createInitialMatchState(roomId);

  advanceAiTurns(state);

  database
    .prepare(
      "UPDATE matches SET game_state_json = ?, state_version = ?, current_turn = ?, updated_at = CURRENT_TIMESTAMP WHERE match_id = ?",
    )
    .run(
      JSON.stringify(state),
      state.stateVersion,
      state.currentPlayer,
      matchId,
    );
  return state;
}

export function getMatch(matchId, userId) {
  const database = getDatabase();
  const row = database
    .prepare("SELECT * FROM matches WHERE match_id = ?")
    .get(matchId);
  if (!row) return null;
  const member = database
    .prepare("SELECT role FROM room_members WHERE room_id = ? AND user_id = ?")
    .get(row.room_id, userId);
  if (!member) return null;

  database
    .prepare(
      `UPDATE room_members
     SET is_connected = 1
     WHERE room_id = ? AND user_id = ?`,
    )
    .run(row.room_id, userId);

  const state = JSON.parse(row.game_state_json);
  const currentPlayer = state.players?.[state.currentPlayer];
  let waitingForPlayer = null;
  if (currentPlayer?.type === "human") {
    const connection = database
      .prepare(
        `SELECT is_connected FROM room_members
       WHERE room_id = ? AND user_id = ?`,
      )
      .get(row.room_id, currentPlayer.userId);
    if (connection && !connection.is_connected) {
      waitingForPlayer = currentPlayer.name;
    }
  }

  return {
    matchId: row.match_id,
    roomId: row.room_id,
    status: row.status,
    role: member.role,
    waitingForPlayer,
    state: waitingForPlayer
      ? {
          ...state,
          waitingForPlayer,
          message: `Waiting for ${waitingForPlayer} to reconnect...`,
        }
      : { ...state, waitingForPlayer: null },
  };
}

export function findActiveMatch(roomId) {
  return (
    getDatabase()
      .prepare(
        "SELECT match_id FROM matches WHERE room_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
      )
      .get(roomId)?.match_id || null
  );
}

export function getActiveMatchForUser(userId) {
  const database = getDatabase();
  const row = database
    .prepare(
      `SELECT m.match_id, m.room_id, m.status, rm.role, rm.seat_number
     FROM matches m
     JOIN room_members rm ON rm.room_id = m.room_id
     WHERE rm.user_id = ?
       AND m.status = 'active'
       AND m.room_id IS NOT NULL
     ORDER BY m.updated_at DESC
     LIMIT 1`,
    )
    .get(userId);

  if (!row) return null;

  database
    .prepare(
      `UPDATE room_members
     SET is_connected = 1
     WHERE room_id = ? AND user_id = ?`,
    )
    .run(row.room_id, userId);

  return {
    matchId: row.match_id,
    roomId: row.room_id,
    status: row.status,
    role: row.role,
    seatNumber: row.seat_number,
  };
}

function replaceLocalMatchPlayers(database, matchId, gameState) {
  const players = Array.isArray(gameState.players) ? gameState.players : [];
  database.prepare("DELETE FROM match_players WHERE match_id = ?").run(matchId);
  const insert = database.prepare(
    `INSERT INTO match_players (
      match_player_id, match_id, user_id, player_type, display_name,
      seat_number, ai_personality_id, final_placement, points,
      cards_purchased, nobles_claimed
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  players.forEach((player, index) => {
    const finalPlacement = player.finalPlacement || null;
    insert.run(
      crypto.randomUUID(),
      matchId,
      player.type === "ai" ? "ai" : "human",
      player.name || `Player ${index + 1}`,
      index + 1,
      player.personalityId || player.personality?.id || null,
      finalPlacement,
      Number(player.points) || 0,
      (player.purchasedCards || player.cards || []).length,
      (player.nobles || []).length,
    );
  });
}

function replaceOnlineMatchPlayers(
  database,
  matchId,
  gameState,
  finalized = false,
) {
  const players = Array.isArray(gameState.players) ? gameState.players : [];
  database.prepare("DELETE FROM match_players WHERE match_id = ?").run(matchId);
  const insert = database.prepare(
    `INSERT INTO match_players (
      match_player_id, match_id, user_id, player_type, display_name,
      seat_number, ai_personality_id, final_placement, points,
      cards_purchased, nobles_claimed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  players.forEach((player, index) => {
    insert.run(
      player.id || crypto.randomUUID(),
      matchId,
      player.type === "human" ? player.userId || null : null,
      player.type === "ai" ? "ai" : "human",
      player.name || `Player ${index + 1}`,
      index + 1,
      player.personalityId || player.personality?.id || null,
      finalized ? player.finalPlacement || null : null,
      finalized ? Number(player.points) || 0 : 0,
      finalized ? (player.purchasedCards || player.cards || []).length : 0,
      finalized ? (player.nobles || []).length : 0,
    );
  });
}

export function saveLocalMatch(input = {}) {
  const database = getDatabase();
  const gameState = input.gameState;
  if (!gameState || !Array.isArray(gameState.players)) {
    return {
      ok: false,
      status: 400,
      message: "A valid local game state is required.",
    };
  }

  const requestedId = String(input.matchId || "").trim();
  const existing = requestedId
    ? database
        .prepare(
          "SELECT match_id FROM matches WHERE match_id = ? AND room_id IS NULL",
        )
        .get(requestedId)
    : null;
  const matchId = existing?.match_id || crypto.randomUUID();
  const status = gameState.gameOver ? "completed" : "active";
  const stateVersion =
    Number(gameState.stateVersion) || Number(input.stateVersion) || 1;
  const currentTurn = Number(gameState.currentPlayer) || 0;

  database.transaction(() => {
    if (existing) {
      database
        .prepare(
          `UPDATE matches SET status = ?, current_turn = ?, game_state_json = ?,
         state_version = ?, updated_at = CURRENT_TIMESTAMP,
         completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END
         WHERE match_id = ? AND room_id IS NULL`,
        )
        .run(
          status,
          currentTurn,
          JSON.stringify(gameState),
          stateVersion,
          status,
          matchId,
        );
    } else {
      database
        .prepare(
          `INSERT INTO matches (
          match_id, room_id, status, current_turn, game_state_json,
          state_version, completed_at
        ) VALUES (?, NULL, ?, ?, ?, ?, CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
        )
        .run(
          matchId,
          status,
          currentTurn,
          JSON.stringify(gameState),
          stateVersion,
          status,
        );
    }
    replaceLocalMatchPlayers(database, matchId, gameState);
  })();

  return getLocalMatch(matchId);
}

export function getLocalMatch(matchId) {
  const row = getDatabase()
    .prepare(
      `SELECT match_id, status, current_turn, game_state_json, state_version,
     created_at, updated_at, completed_at
     FROM matches WHERE match_id = ? AND room_id IS NULL`,
    )
    .get(matchId);
  if (!row) return null;
  const gameState = parseStoredGameState(row.game_state_json);
  if (!gameState) return null;

  return {
    matchId: row.match_id,
    status: row.status,
    currentTurn: row.current_turn,
    stateVersion: row.state_version,
    createdAt: row.created_at,
    savedAt: row.updated_at,
    completedAt: row.completed_at,
    gameState,
  };
}

export function getLatestLocalMatch() {
  const row = getDatabase()
    .prepare(
      `SELECT match_id FROM matches
     WHERE room_id IS NULL AND status = 'active'
     ORDER BY updated_at DESC LIMIT 1`,
    )
    .get();
  return row ? getLocalMatch(row.match_id) : null;
}

export function deleteLocalMatch(matchId) {
  const database = getDatabase();
  const normalizedMatchId = String(matchId || "").trim();
  if (!normalizedMatchId) {
    return { ok: false, status: 400, message: "A local match ID is required." };
  }

  const remove = database.transaction(() => {
    const localMatch = database
      .prepare(
        "SELECT match_id FROM matches WHERE match_id = ? AND room_id IS NULL",
      )
      .get(normalizedMatchId);

    if (!localMatch) {
      return {
        ok: false,
        status: 404,
        message: "That local game was not found.",
      };
    }

    database
      .prepare("DELETE FROM match_players WHERE match_id = ?")
      .run(normalizedMatchId);

    const deletedMatch = database
      .prepare("DELETE FROM matches WHERE match_id = ? AND room_id IS NULL")
      .run(normalizedMatchId);

    const remainingPlayers = database
      .prepare("SELECT COUNT(*) AS count FROM match_players WHERE match_id = ?")
      .get(normalizedMatchId).count;

    if (deletedMatch.changes !== 1 || remainingPlayers !== 0) {
      throw new Error("The local game could not be deleted completely.");
    }

    return { ok: true, status: 200, matchId: normalizedMatchId };
  });

  return remove();
}

function assignFinalPlacements(state) {
  const ordered = [...state.players].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    return left.purchasedCards.length - right.purchasedCards.length;
  });
  let previousKey = null;
  let placement = 0;
  ordered.forEach((player, index) => {
    const key = `${player.points}:${player.purchasedCards.length}`;
    if (key !== previousKey) placement = index + 1;
    const original = state.players.find(
      (candidate) => candidate.id === player.id,
    );
    if (original) original.finalPlacement = placement;
    previousKey = key;
  });
}

export function abandonActiveMatch(matchId, userId) {
  const database = getDatabase();
  const normalizedMatchId = String(matchId || "").trim();
  const match = database
    .prepare(
      `SELECT m.match_id, m.room_id, m.status, m.game_state_json, r.host_user_id
     FROM matches m
     JOIN rooms r ON r.room_id = m.room_id
     WHERE m.match_id = ? AND m.room_id IS NOT NULL`,
    )
    .get(normalizedMatchId);

  if (!match || match.status !== "active") {
    return {
      ok: false,
      status: 404,
      message: "That active match is unavailable.",
    };
  }
  if (match.host_user_id !== userId) {
    return {
      ok: false,
      status: 403,
      message: "Only the host can end this match.",
    };
  }

  const state = parseStoredGameState(match.game_state_json);
  if (!state) {
    return {
      ok: false,
      status: 409,
      message: "The saved match state is unavailable.",
    };
  }
  if (state.gameOver && state.winners?.length) {
    return {
      ok: false,
      status: 409,
      message: "A finished match cannot be abandoned.",
    };
  }

  state.gameOver = true;
  state.winners = [];
  state.waitingForPlayer = null;
  state.stateVersion += 1;
  state.message = "This match was ended by the host and was not counted.";

  database.transaction(() => {
    database
      .prepare(
        `UPDATE matches SET status = 'abandoned', game_state_json = ?,
       state_version = ?, updated_at = CURRENT_TIMESTAMP, completed_at = NULL
       WHERE match_id = ? AND status = 'active'`,
      )
      .run(JSON.stringify(state), state.stateVersion, match.match_id);
    database
      .prepare(
        `UPDATE rooms SET status = 'finished', updated_at = CURRENT_TIMESTAMP
       WHERE room_id = ?`,
      )
      .run(match.room_id);
    replaceOnlineMatchPlayers(database, match.match_id, state, false);
  })();

  return {
    ok: true,
    status: 200,
    matchId: match.match_id,
    roomId: match.room_id,
    matchStatus: "abandoned",
    state,
  };
}

export function leaveActiveMatch(matchId, userId, mode = "temporary") {
  const database = getDatabase();
  const normalizedMatchId = String(matchId || "").trim();
  if (!normalizedMatchId) {
    return { ok: false, status: 400, message: "A match ID is required." };
  }
  if (!["temporary", "replaceWithAi"].includes(mode)) {
    return { ok: false, status: 400, message: "Choose a valid leave option." };
  }

  const match = database
    .prepare(
      `SELECT match_id, room_id, status, game_state_json, state_version
     FROM matches
     WHERE match_id = ? AND room_id IS NOT NULL`,
    )
    .get(normalizedMatchId);
  if (!match || match.status !== "active") {
    return {
      ok: false,
      status: 404,
      message: "That active match is unavailable.",
    };
  }

  const member = database
    .prepare(
      `SELECT * FROM room_members
     WHERE room_id = ? AND user_id = ? AND role <> 'spectator'`,
    )
    .get(match.room_id, userId);
  if (!member) {
    return {
      ok: false,
      status: 403,
      message: "You do not occupy a player seat in this match.",
    };
  }

  if (mode === "temporary") {
    database
      .prepare(
        `UPDATE room_members SET is_connected = 0
       WHERE room_id = ? AND user_id = ?`,
      )
      .run(match.room_id, userId);
    return {
      ok: true,
      status: 200,
      matchId: match.match_id,
      roomId: match.room_id,
      disconnected: true,
      replacedWithAi: false,
    };
  }

  const personalities = ["builder", "investor", "nobleHunter", "finisher"];
  const personalityId =
    personalities[crypto.randomInt(0, personalities.length)];
  const aiMemberId = crypto.randomUUID();
  const state = parseStoredGameState(match.game_state_json);
  if (!state) {
    return {
      ok: false,
      status: 409,
      message: "The saved match state is unavailable.",
    };
  }
  const playerIndex = state.players.findIndex(
    (player) => player.userId === userId,
  );
  if (playerIndex < 0) {
    return {
      ok: false,
      status: 409,
      message: "Your player seat was not found in the match state.",
    };
  }

  const departingPlayer = state.players[playerIndex];
  state.players[playerIndex] = {
    ...departingPlayer,
    id: aiMemberId,
    userId: null,
    type: "ai",
    name: `${personalityId} AI`,
    personalityId,
  };
  state.stateVersion += 1;
  state.message = `${departingPlayer.name} was replaced by ${personalityId} AI.`;
  advanceAiTurns(state);

  database.transaction(() => {
    database
      .prepare(
        `UPDATE room_members
       SET role = 'spectator', member_type = 'spectator', seat_number = NULL,
           is_connected = 0
       WHERE room_member_id = ?`,
      )
      .run(member.room_member_id);
    database
      .prepare(
        `INSERT INTO room_members (
        room_member_id, room_id, user_id, member_type, role, seat_number,
        ai_personality_id, is_connected
      ) VALUES (?, ?, NULL, 'ai', 'player', ?, ?, 1)`,
      )
      .run(aiMemberId, match.room_id, member.seat_number, personalityId);
    database
      .prepare(
        `UPDATE matches SET game_state_json = ?, state_version = ?,
       current_turn = ?, updated_at = CURRENT_TIMESTAMP
       WHERE match_id = ? AND state_version = ?`,
      )
      .run(
        JSON.stringify(state),
        state.stateVersion,
        state.currentPlayer,
        match.match_id,
        match.state_version,
      );
    replaceOnlineMatchPlayers(database, match.match_id, state, false);
  })();

  return {
    ok: true,
    status: 200,
    matchId: match.match_id,
    roomId: match.room_id,
    disconnected: true,
    replacedWithAi: true,
    personalityId,
  };
}

export function performCommand(matchId, userId, body) {
  const database = getDatabase();
  const record = getMatch(matchId, userId);
  if (!record)
    return { ok: false, status: 404, message: "That match is unavailable." };
  if (record.role === "spectator")
    return {
      ok: false,
      status: 403,
      message: "Spectators cannot perform game actions.",
    };
  const state = record.state;
  if (state.gameOver)
    return { ok: false, status: 409, message: "This match is complete." };
  if (Number(body.stateVersion) !== state.stateVersion)
    return {
      ok: false,
      status: 409,
      message: "The board changed. The latest state has been loaded.",
      state,
    };
  const current = state.players[state.currentPlayer];
  if (current.type === "human") {
    const currentConnection = database
      .prepare(
        `SELECT is_connected FROM room_members
       WHERE room_id = ? AND user_id = ?`,
      )
      .get(record.roomId, current.userId);
    if (currentConnection && !currentConnection.is_connected) {
      return {
        ok: false,
        status: 409,
        message: `Waiting for ${current.name} to reconnect...`,
        state,
      };
    }
  }
  if (current.type !== "human" || current.userId !== userId)
    return { ok: false, status: 403, message: "It is not your turn." };

  try {
    applyMatchCommand(state, body.command || {});
  } catch (error) {
    return { ok: false, status: 400, message: error.message, state };
  }

  const hasWinner =
    state.gameOver && Array.isArray(state.winners) && state.winners.length > 0;
  if (state.gameOver && !hasWinner) {
    return {
      ok: false,
      status: 409,
      message: "A match cannot finish without a declared winner.",
      state,
    };
  }
  if (hasWinner) assignFinalPlacements(state);
  const status = hasWinner ? "completed" : "active";
  const persist = database.transaction(() => {
    const update = database
      .prepare(
        `UPDATE matches SET status = ?, current_turn = ?, game_state_json = ?,
       state_version = ?, updated_at = CURRENT_TIMESTAMP,
       completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE match_id = ? AND room_id = ? AND state_version = ?`,
      )
      .run(
        status,
        state.currentPlayer,
        JSON.stringify(state),
        state.stateVersion,
        status,
        matchId,
        record.roomId,
        Number(body.stateVersion),
      );

    if (update.changes !== 1) {
      throw new Error(
        "The online match changed before the action could be saved.",
      );
    }

    replaceOnlineMatchPlayers(database, matchId, state, hasWinner);

    if (hasWinner) {
      database
        .prepare(
          "UPDATE rooms SET status = 'finished', updated_at = CURRENT_TIMESTAMP WHERE room_id = ?",
        )
        .run(record.roomId);
    }
  });

  try {
    persist();
  } catch (error) {
    const latest = getMatch(matchId, userId);
    return {
      ok: false,
      status: 409,
      message: error.message,
      state: latest?.state || record.state,
    };
  }

  const saved = getMatch(matchId, userId);
  return {
    ok: true,
    status: 200,
    state: saved.state,
    matchStatus: saved.status,
    persistedStateVersion: saved.state.stateVersion,
  };
}

export function getRecoverableLocalMatch() {
  return getLatestLocalMatch();
}
