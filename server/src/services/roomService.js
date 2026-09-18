import crypto from "node:crypto";
import { getDatabase } from "../database/database.js";

const ROOM_NAME_MIN = 3;
const ROOM_NAME_MAX = 40;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createRoomCode() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += ROOM_CODE_ALPHABET[crypto.randomInt(0, ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

function getUniqueRoomCode(database) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = createRoomCode();
    const exists = database.prepare("SELECT 1 FROM rooms WHERE room_code = ?").get(code);
    if (!exists) return code;
  }
  throw new Error("Royal Treasury was unable to generate a room code.");
}

function mapMember(row) {
  return {
    roomMemberId: row.room_member_id,
    userId: row.user_id,
    displayName: row.display_name || (row.member_type === "ai" ? "AI Player" : "Spectator"),
    memberType: row.member_type,
    role: row.role,
    seatNumber: row.seat_number,
    aiPersonalityId: row.ai_personality_id,
    isConnected: Boolean(row.is_connected),
  };
}

function readMembers(database, roomId) {
  return database.prepare(
    `SELECT rm.*, CASE
       WHEN u.user_id IS NULL THEN NULL
       WHEN TRIM(u.last_name) = '' THEN u.first_name
       ELSE u.first_name || ' ' || UPPER(SUBSTR(u.last_name, 1, 1)) || '.'
     END AS display_name
     FROM room_members rm
     LEFT JOIN users u ON u.user_id = rm.user_id
     WHERE rm.room_id = ?
     ORDER BY CASE WHEN rm.seat_number IS NULL THEN 99 ELSE rm.seat_number END, rm.joined_at`,
  ).all(roomId).map(mapMember);
}

function mapRoom(database, row) {
  const members = readMembers(database, row.room_id);
  const players = members.filter((member) => member.role !== "spectator");
  const spectators = members.filter((member) => member.role === "spectator");
  return {
    roomId: row.room_id,
    roomCode: row.room_code,
    roomName: row.room_name,
    hostUserId: row.host_user_id,
    hostDisplayName: row.host_display_name,
    visibility: row.visibility,
    maximumPlayers: row.maximum_players,
    spectatorsAllowed: Boolean(row.spectators_allowed),
    status: row.status,
    createdAt: row.created_at,
    playerCount: players.length,
    spectatorCount: spectators.length,
    players,
    spectators,
  };
}

const ROOM_SELECT = `SELECT r.*, CASE
  WHEN TRIM(u.last_name) = '' THEN u.first_name
  ELSE u.first_name || ' ' || UPPER(SUBSTR(u.last_name, 1, 1)) || '.'
END AS host_display_name
FROM rooms r
JOIN users u ON u.user_id = r.host_user_id`;

export function listPublicRooms() {
  const database = getDatabase();
  const rows = database.prepare(
    `${ROOM_SELECT}
     WHERE r.visibility = 'public' AND r.status IN ('waiting', 'in_progress')
     ORDER BY CASE r.status WHEN 'waiting' THEN 0 ELSE 1 END, r.updated_at DESC`,
  ).all();
  return rows.map((row) => mapRoom(database, row));
}

export function listMyRooms(userId) {
  const database = getDatabase();
  const rows = database.prepare(
    `${ROOM_SELECT}
     WHERE r.room_id IN (
       SELECT room_id FROM room_members WHERE user_id = ?
     ) AND r.status IN ('waiting', 'in_progress')
     ORDER BY r.updated_at DESC`,
  ).all(userId);
  return rows.map((row) => mapRoom(database, row));
}

export function getRoomById(roomId) {
  const database = getDatabase();
  const row = database.prepare(`${ROOM_SELECT} WHERE r.room_id = ?`).get(roomId);
  return row ? mapRoom(database, row) : null;
}

export function createRoom(userId, input = {}) {
  const database = getDatabase();
  const roomName = String(input.roomName || "").trim();
  const visibility = input.visibility === "private" ? "private" : "public";
  const maximumPlayers = Number(input.maximumPlayers);
  const spectatorsAllowed = input.spectatorsAllowed !== false;

  if (roomName.length < ROOM_NAME_MIN || roomName.length > ROOM_NAME_MAX) {
    return { ok: false, status: 400, message: "Room name must be 3-40 characters." };
  }
  if (![2, 3, 4].includes(maximumPlayers)) {
    return { ok: false, status: 400, message: "Choose 2, 3, or 4 player seats." };
  }

  const existingMembership = database.prepare(
    `SELECT r.room_id FROM rooms r
     JOIN room_members rm ON rm.room_id = r.room_id
     WHERE rm.user_id = ? AND rm.role <> 'spectator'
       AND r.status IN ('waiting', 'in_progress')`,
  ).get(userId);
  if (existingMembership) {
    return { ok: false, status: 409, message: "Leave your current room before creating another room." };
  }

  const roomId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const roomCode = getUniqueRoomCode(database);
  const transaction = database.transaction(() => {
    database.prepare(
      `INSERT INTO rooms (
        room_id, room_code, room_name, host_user_id, visibility,
        maximum_players, spectators_allowed, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
    ).run(roomId, roomCode, roomName, userId, visibility, maximumPlayers, spectatorsAllowed ? 1 : 0);
    database.prepare(
      `INSERT INTO room_members (
        room_member_id, room_id, user_id, member_type, role, seat_number, is_connected
      ) VALUES (?, ?, ?, 'human', 'host', 1, 1)`,
    ).run(memberId, roomId, userId);
  });
  transaction();
  return { ok: true, status: 201, room: getRoomById(roomId) };
}

export function joinRoom(userId, roomIdentifier, asSpectator = false) {
  const database = getDatabase();
  const identifier = String(roomIdentifier || "").trim();
  const row = database.prepare(
    `${ROOM_SELECT} WHERE r.room_id = ? OR r.room_code = ? COLLATE NOCASE`,
  ).get(identifier, identifier);
  if (!row || !["waiting", "in_progress"].includes(row.status)) {
    return { ok: false, status: 404, message: "That room is unavailable." };
  }

  const room = mapRoom(database, row);
  const existing = database.prepare(
    "SELECT room_member_id FROM room_members WHERE room_id = ? AND user_id = ?",
  ).get(room.roomId, userId);
  if (existing) {
    database.prepare(
      "UPDATE room_members SET is_connected = 1 WHERE room_member_id = ?",
    ).run(existing.room_member_id);
    return { ok: true, status: 200, room: getRoomById(room.roomId) };
  }

  if (asSpectator) {
    if (!room.spectatorsAllowed) {
      return { ok: false, status: 403, message: "Spectators are not allowed in this room." };
    }
    database.prepare(
      `INSERT INTO room_members (
        room_member_id, room_id, user_id, member_type, role, seat_number, is_connected
      ) VALUES (?, ?, ?, 'spectator', 'spectator', NULL, 1)`,
    ).run(crypto.randomUUID(), room.roomId, userId);
  } else {
    if (room.status !== "waiting") {
      return { ok: false, status: 409, message: "This game has already started. You may spectate instead." };
    }
    const occupiedSeats = new Set(room.players.map((player) => player.seatNumber));
    let seatNumber = null;
    for (let seat = 1; seat <= room.maximumPlayers; seat += 1) {
      if (!occupiedSeats.has(seat)) { seatNumber = seat; break; }
    }
    if (!seatNumber) {
      return { ok: false, status: 409, message: "This room has no open player seats." };
    }
    const otherRoom = database.prepare(
      `SELECT r.room_id FROM rooms r JOIN room_members rm ON rm.room_id = r.room_id
       WHERE rm.user_id = ? AND rm.role <> 'spectator'
         AND r.status IN ('waiting', 'in_progress')`,
    ).get(userId);
    if (otherRoom) {
      return { ok: false, status: 409, message: "Leave your current room before joining another room." };
    }
    database.prepare(
      `INSERT INTO room_members (
        room_member_id, room_id, user_id, member_type, role, seat_number, is_connected
      ) VALUES (?, ?, ?, 'human', 'player', ?, 1)`,
    ).run(crypto.randomUUID(), room.roomId, userId, seatNumber);
  }

  database.prepare("UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE room_id = ?").run(room.roomId);
  return { ok: true, status: 200, room: getRoomById(room.roomId) };
}

export function leaveRoom(userId, roomId) {
  const database = getDatabase();
  const room = getRoomById(roomId);
  if (!room) return { ok: false, status: 404, message: "That room is unavailable." };
  const member = database.prepare(
    "SELECT * FROM room_members WHERE room_id = ? AND user_id = ?",
  ).get(roomId, userId);
  if (!member) return { ok: true, status: 200 };

  const transaction = database.transaction(() => {
    database.prepare("DELETE FROM room_members WHERE room_id = ? AND user_id = ?").run(roomId, userId);
    if (room.hostUserId === userId) {
      const nextHuman = database.prepare(
        `SELECT user_id FROM room_members
         WHERE room_id = ? AND user_id IS NOT NULL AND role <> 'spectator'
         ORDER BY seat_number LIMIT 1`,
      ).get(roomId);
      if (nextHuman) {
        database.prepare("UPDATE room_members SET role = 'host' WHERE room_id = ? AND user_id = ?").run(roomId, nextHuman.user_id);
        database.prepare("UPDATE rooms SET host_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE room_id = ?").run(nextHuman.user_id, roomId);
      } else {
        database.prepare("UPDATE rooms SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE room_id = ?").run(roomId);
      }
    } else {
      database.prepare("UPDATE rooms SET updated_at = CURRENT_TIMESTAMP WHERE room_id = ?").run(roomId);
    }
  });
  transaction();
  return { ok: true, status: 200 };
}
