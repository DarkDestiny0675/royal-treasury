import { Router } from "express";
import { authenticateRequest } from "../middleware/authenticateRequest.js";
import {
  abandonActiveMatch,
  deleteLocalMatch,
  findActiveMatch,
  getActiveMatchForUser,
  getLatestLocalMatch,
  getLocalMatch,
  getMatch,
  leaveActiveMatch,
  performCommand,
  saveLocalMatch,
} from "../services/matchService.js";

export const matchRouter = Router();

matchRouter.get("/local/latest", (request, response) => {
  const match = getLatestLocalMatch();
  response
    .status(match ? 200 : 404)
    .json(match || { message: "No active local game was found." });
});

matchRouter.get("/local/:matchId", (request, response) => {
  const match = getLocalMatch(request.params.matchId);
  response
    .status(match ? 200 : 404)
    .json(match || { message: "That local game was not found." });
});

matchRouter.put("/local", (request, response) => {
  const result = saveLocalMatch(request.body);
  if (result?.ok === false) {
    response.status(result.status).json({ message: result.message });
    return;
  }
  response.status(200).json(result);
});

matchRouter.delete("/local/:matchId", (request, response) => {
  const result = deleteLocalMatch(request.params.matchId);
  if (!result.ok) {
    response.status(result.status).json({ message: result.message });
    return;
  }

  response.status(200).json({
    matchId: result.matchId,
    deleted: true,
  });
});

matchRouter.use(authenticateRequest);
matchRouter.get("/active/me", (request, response) => {
  const match = getActiveMatchForUser(request.user.userId);
  response
    .status(match ? 200 : 404)
    .json(match || { message: "No active online match was found." });
});

matchRouter.get("/room/:roomId", (request, response) => {
  const matchId = findActiveMatch(request.params.roomId);
  if (!matchId) return response.status(404).json({ message: "No active match was found." });
  const match = getMatch(matchId, request.user.userId);
  response.status(match ? 200 : 403).json(match || { message: "You are not a member of this match." });
});

matchRouter.post("/:matchId/end", (request, response) => {
  const result = abandonActiveMatch(
    request.params.matchId,
    request.user.userId,
  );
  response.status(result.status).json(
    result.ok
      ? {
          matchId: result.matchId,
          roomId: result.roomId,
          status: result.matchStatus,
          state: result.state,
        }
      : { message: result.message },
  );
});

matchRouter.post("/:matchId/leave", (request, response) => {
  const result = leaveActiveMatch(
    request.params.matchId,
    request.user.userId,
    request.body?.mode,
  );
  response.status(result.status).json(
    result.ok
      ? {
          matchId: result.matchId,
          roomId: result.roomId,
          disconnected: result.disconnected,
          replacedWithAi: result.replacedWithAi,
          personalityId: result.personalityId,
        }
      : { message: result.message },
  );
});

matchRouter.get("/:matchId", (request, response) => {
  const match = getMatch(request.params.matchId, request.user.userId);
  response.status(match ? 200 : 404).json(match || { message: "That match is unavailable." });
});

matchRouter.post("/:matchId/actions", (request, response) => {
  const result = performCommand(request.params.matchId, request.user.userId, request.body);
  response.status(result.status).json(
    result.ok
      ? {
          state: result.state,
          status: result.matchStatus,
          persistedStateVersion: result.persistedStateVersion,
        }
      : { message: result.message, state: result.state },
  );
});
