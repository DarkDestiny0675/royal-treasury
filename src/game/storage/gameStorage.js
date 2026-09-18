import {
  deleteLocalMatch,
  loadLatestLocalMatch,
  loadLocalMatch,
  saveLocalMatch,
} from "../../services/matchApi";

const LEGACY_SAVE_KEY = "royalTreasury.savedGame.v2";
const LOCAL_MATCH_ID_KEY = "royalTreasury.localMatchId.v1";

function readLegacySave() {
  try {
    const text = localStorage.getItem(LEGACY_SAVE_KEY);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function readLocalMatchId() {
  return localStorage.getItem(LOCAL_MATCH_ID_KEY) || "";
}

function rememberLocalMatchId(matchId) {
  if (matchId) localStorage.setItem(LOCAL_MATCH_ID_KEY, matchId);
  else localStorage.removeItem(LOCAL_MATCH_ID_KEY);
}

function normalizeMatch(match) {
  if (!match?.gameState) return null;
  return {
    version: 3,
    matchId: match.matchId,
    savedAt: match.savedAt || new Date().toISOString(),
    status: match.status || "active",
    gameState: {
      ...match.gameState,
      aiThinking: false,
      aiMessage: "",
    },
  };
}

export async function loadSavedGame() {
  const storedMatchId = readLocalMatchId();

  if (storedMatchId) {
    try {
      const rememberedMatch = await loadLocalMatch(storedMatchId);
      const normalized = normalizeMatch(rememberedMatch);
      if (normalized) {
        rememberLocalMatchId(normalized.matchId);
        return normalized;
      }
    } catch (error) {
      if (error.status !== 404) throw error;
      rememberLocalMatchId("");
    }
  }

  try {
    const latestMatch = await loadLatestLocalMatch();
    const normalized = normalizeMatch(latestMatch);
    if (normalized) {
      rememberLocalMatchId(normalized.matchId);
      return normalized;
    }
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const legacy = readLegacySave();
  if (!legacy?.gameState) return null;

  const migrated = await saveGame(legacy.gameState);
  localStorage.removeItem(LEGACY_SAVE_KEY);
  return migrated;
}

export async function saveGame(gameState, matchId = readLocalMatchId()) {
  const cleanState = {
    ...gameState,
    aiThinking: false,
    aiMessage: "",
  };
  const saved = await saveLocalMatch(matchId, cleanState);
  rememberLocalMatchId(saved.matchId);
  localStorage.removeItem(LEGACY_SAVE_KEY);
  const normalized=normalizeMatch(saved);
  return normalized && normalized.status === "active" ? normalized : normalized;
}

export async function clearSavedGame(matchId = readLocalMatchId()) {
  const normalizedMatchId = String(matchId || "").trim();

  if (normalizedMatchId) {
    const result = await deleteLocalMatch(normalizedMatchId);
    if (!result?.deleted || result.matchId !== normalizedMatchId) {
      throw new Error("The local game deletion could not be verified.");
    }
  }

  rememberLocalMatchId("");
  localStorage.removeItem(LEGACY_SAVE_KEY);
  return true;
}

export function getSavedLocalMatchId() {
  return readLocalMatchId();
}
