export function createSimulationState() {
  return {
    active: false,
    requestedGames: 0,
    completedGames: 0,
    delayMilliseconds: 25,
    nextGameDelayMilliseconds: 750,
  };
}
