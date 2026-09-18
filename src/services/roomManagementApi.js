import { getAuthToken } from "../auth/authSession";
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      payload.message || "Royal Treasury could not update the room.",
    );
  return payload;
}
export const loadOnlineRoom = (id) =>
  request(`/api/room-management/${encodeURIComponent(id)}`);
export const setPlayerReady = (id, isReady) =>
  request(`/api/room-management/${id}/ready`, {
    method: "POST",
    body: JSON.stringify({ isReady }),
  });
export const addRoomAi = (id, personalityId) =>
  request(`/api/room-management/${id}/ai`, {
    method: "POST",
    body: JSON.stringify({ personalityId }),
  });
export const removeRoomAi = (id, memberId) =>
  request(`/api/room-management/${id}/ai/${memberId}`, { method: "DELETE" });
export const removeRoomPlayer = (id, memberId) =>
  request(`/api/room-management/${id}/players/${memberId}`, {
    method: "DELETE",
  });
export const transferRoomHost = (id, memberId) =>
  request(`/api/room-management/${id}/transfer-host`, {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });
export const saveRoomSettings = (id, data) =>
  request(`/api/room-management/${id}/settings`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const startOnlineMatch = (id) =>
  request(`/api/room-management/${id}/start`, { method: "POST" });
