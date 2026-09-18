const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Royal Treasury could not complete the request.");
  }
  return payload;
}

export function registerAccount(account) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(account),
  });
}

export function loginAccount(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function loadAccountSession(token) {
  return request("/api/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function logoutAccount() {
  return request("/api/auth/logout", { method: "POST" });
}
