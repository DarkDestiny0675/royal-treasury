import { getAuthToken } from "../auth/authSession";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}, authenticated = true) {
  const token = authenticated ? getAuthToken() : null;
  const response = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || "Match request failed.");
    error.status = response.status;
    error.state = payload?.state;
    throw error;
  }
  if (payload === null) {
    throw new Error("The match server returned an invalid response.");
  }
  return payload;
}

export const loadMyActiveMatch = () => request("/api/matches/active/me");
export const endOnlineMatch = (id) => request(
  `/api/matches/${encodeURIComponent(id)}/end`,
  { method: "POST" },
);
export const leaveOnlineMatch = (id, mode) => request(
  `/api/matches/${encodeURIComponent(id)}/leave`,
  { method: "POST", body: JSON.stringify({ mode }) },
);
export const loadMatch = (id) => request(`/api/matches/${id}`);
export const loadRoomMatch = (id) => request(`/api/matches/room/${id}`);
export const sendMatchAction = (id, stateVersion, command) => request(
  `/api/matches/${id}/actions`,
  {
    method: "POST",
    body: JSON.stringify({
      stateVersion,
      command,
      requestId: crypto.randomUUID(),
    }),
  },
);

export const loadLatestLocalMatch = () => request("/api/matches/local/latest", {}, false);
export const loadLocalMatch = (id) => request(`/api/matches/local/${encodeURIComponent(id)}`, {}, false);
export const saveLocalMatch = (matchId, gameState) => request(
  "/api/matches/local",
  { method: "PUT", body: JSON.stringify({ matchId, gameState }) },
  false,
);
export const deleteLocalMatch = (id) => request(
  `/api/matches/local/${encodeURIComponent(id)}`,
  { method: "DELETE" },
  false,
);
