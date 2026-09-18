import { getAuthToken } from "../auth/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Royal Treasury could not complete the room request.");
  return payload;
}

export function loadRooms() { return request("/api/rooms"); }
export function createOnlineRoom(room) { return request("/api/rooms", { method: "POST", body: JSON.stringify(room) }); }
export function joinOnlineRoom(roomIdentifier, asSpectator = false) { return request(`/api/rooms/${encodeURIComponent(roomIdentifier)}/join`, { method: "POST", body: JSON.stringify({ asSpectator }) }); }
export function leaveOnlineRoom(roomId) { return request(`/api/rooms/${encodeURIComponent(roomId)}/leave`, { method: "POST" }); }
