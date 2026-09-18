import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
dotenv.config({ path: path.join(root, ".env") });

const rawDatabasePath = String(
  process.env.DATABASE_PATH || "./data/royal-treasury.db",
);
const configuredOrigins = String(
  process.env.CLIENT_ORIGINS ||
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5173,http://localhost:5174",
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const environment = Object.freeze({
  port: Number(process.env.PORT) || 3001,
  clientOrigin: configuredOrigins[0],
  clientOrigins: configuredOrigins,
  databasePath: path.isAbsolute(rawDatabasePath)
    ? rawDatabasePath
    : path.resolve(root, rawDatabasePath),
  jwtSecret:
    process.env.JWT_SECRET ||
    "royal-treasury-local-development-secret-change-before-public-hosting",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || "30d",
});
