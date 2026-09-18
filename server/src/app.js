import cors from "cors";
import express from "express";
import helmet from "helmet";
import { environment } from "./config/environment.js";
import { authRouter } from "./routes/authRoutes.js";
import { healthRouter } from "./routes/healthRoutes.js";
import { roomRouter } from "./routes/roomRoutes.js";
import { roomManagementRouter } from "./routes/roomManagementRoutes.js";
import { matchRouter } from "./routes/matchRoutes.js";
import { communityRouter } from "./routes/communityRoutes.js";

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (environment.clientOrigins.includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):(4173|517[3-9])$/.test(origin);
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        callback(
          isAllowedOrigin(origin)
            ? null
            : new Error("Origin is not allowed by Royal Treasury CORS."),
          isAllowedOrigin(origin),
        );
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.get("/", (request, response) =>
    response.json({
      name: "Royal Treasury Multiplayer Server",
      status: "online",
    }),
  );
  app.use("/api/health", healthRouter);
  app.get("/api/recovery-status", (request, response) =>
    response.json({ status: "ready" }),
  );
  app.use("/api/auth", authRouter);
  app.use("/api/rooms", roomRouter);
  app.use("/api/room-management", roomManagementRouter);
  app.use("/api/matches", matchRouter);
  app.use("/api/community", communityRouter);
  app.use((request, response) =>
    response
      .status(404)
      .json({
        message: "The requested Royal Treasury endpoint does not exist.",
      }),
  );
  app.use((error, request, response, next) => {
    console.error(error);
    response
      .status(500)
      .json({ message: "Royal Treasury could not complete the request." });
  });
  return app;
}
