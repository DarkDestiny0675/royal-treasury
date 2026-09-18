import { createGame } from "../gameSetup";
import { applyThemedCardNames } from "./themedCardNames";

export function createThemedGame(options = {}) {
  return applyThemedCardNames(createGame(options));
}
