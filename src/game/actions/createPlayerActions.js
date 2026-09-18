import { createCardActions } from "./createCardActions";
import { createGemActions } from "./createGemActions";

export function createPlayerActions(dependencies) {
  return {
    ...createGemActions(dependencies),
    ...createCardActions(dependencies),
  };
}
