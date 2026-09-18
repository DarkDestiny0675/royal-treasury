import { Router } from "express";
import { authenticateRequest } from "../middleware/authenticateRequest.js";
import { createRoom, joinRoom, leaveRoom, listMyRooms, listPublicRooms } from "../services/roomService.js";

export const roomRouter = Router();
roomRouter.use(authenticateRequest);

roomRouter.get("/", (request, response) => {
  response.json({ publicRooms: listPublicRooms(), myRooms: listMyRooms(request.user.userId) });
});

roomRouter.post("/", (request, response) => {
  const result = createRoom(request.user.userId, request.body);
  response.status(result.status).json(result.ok ? { room: result.room } : { message: result.message });
});

roomRouter.post("/:roomIdentifier/join", (request, response) => {
  const result = joinRoom(request.user.userId, request.params.roomIdentifier, Boolean(request.body?.asSpectator));
  response.status(result.status).json(result.ok ? { room: result.room } : { message: result.message });
});

roomRouter.post("/:roomId/leave", (request, response) => {
  const result = leaveRoom(request.user.userId, request.params.roomId);
  response.status(result.status).json(result.ok ? { ok: true } : { message: result.message });
});
