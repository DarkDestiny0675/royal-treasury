import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  endOnlineMatch,
  leaveOnlineMatch,
  loadMatch,
  sendMatchAction,
} from "../services/matchApi";
import { leaveOnlineRoom } from "../services/roomApi";

export function useOnlineRoyalTreasuryGame(matchId, user) {
  const [state, setState] = useState(null);
  const [role, setRole] = useState(null);
  const [message, setMessage] = useState("Loading match...");
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    if (leaving || busyRef.current) return;
    try {
      const result = await loadMatch(matchId);
      if (busyRef.current) return;
      setState(result.state);
      setRole(result.role);
      setMessage("");
    } catch (error) {
      if (!busyRef.current) setMessage(error.message);
    }
  }, [matchId, leaving]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 1500);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const act = useCallback(async (command) => {
    if (!state || busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await sendMatchAction(matchId, state.stateVersion, command);
      if (result.persistedStateVersion !== result.state?.stateVersion) {
        throw new Error("The online action was not confirmed as saved.");
      }
      setState(result.state);
      return true;
    } catch (error) {
      if (error.state) setState(error.state);
      setMessage(error.message);
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [matchId, state]);

  const leaveMatch = useCallback(async (mode = "temporary") => {
    if (leaving) return false;
    setLeaving(true);
    setMessage("");
    try {
      const result = await leaveOnlineMatch(matchId, mode);
      if (!result?.disconnected) {
        throw new Error("The match exit could not be confirmed.");
      }
      return true;
    } catch (error) {
      setMessage(error.message);
      setLeaving(false);
      return false;
    }
  }, [matchId, leaving]);

  const endMatch = useCallback(async () => {
    if (leaving) return false;
    setLeaving(true);
    setMessage("");
    try {
      const result = await endOnlineMatch(matchId);
      if (result?.status !== "abandoned") {
        throw new Error("The match ending could not be confirmed.");
      }
      setState(result.state);
      return true;
    } catch (error) {
      setMessage(error.message);
      setLeaving(false);
      return false;
    }
  }, [matchId, leaving]);

  const stopSpectating = useCallback(async () => {
    if (leaving || !state?.roomId) return false;
    setLeaving(true);
    setMessage("");
    try {
      const result = await leaveOnlineRoom(state.roomId);
      if (!result?.ok) {
        throw new Error("Spectator exit could not be confirmed.");
      }
      return true;
    } catch (error) {
      setMessage(error.message);
      setLeaving(false);
      return false;
    }
  }, [leaving, state?.roomId]);

  const current = state?.players?.[state.currentPlayer];
  const canAct =
    role !== "spectator" &&
    current?.type === "human" &&
    current?.userId === user?.userId &&
    !state?.gameOver;

  const actions = useMemo(() => ({
    collectGem: (color) => act({ type: "collectGem", color }),
    returnSelectedGem: (color) => act({ type: "returnGem", color }),
    confirmGemSelection: () => act({ type: "confirmGems" }),
    purchaseMarketCard: (card, tier) => act({
      type: "purchaseMarket",
      cardId: card.id,
      tier,
    }),
    reserveMarketCard: (card, tier) => act({
      type: "reserveMarket",
      cardId: card.id,
      tier,
    }),
    purchaseReservedCard: (card) => act({
      type: "purchaseReserved",
      cardId: card.id,
      tier: card.reservedFromTier || card.tier,
    }),
    claimNoble: (noble) => act({ type: "claimNoble", nobleId: noble.id }),
  }), [act]);

  return {
    gameState: state,
    role,
    message,
    busy,
    leaving,
    canAct,
    actions,
    refresh,
    leaveMatch,
    stopSpectating,
    endMatch,
  };
}
