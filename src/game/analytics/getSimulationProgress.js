export function getSimulationProgress(simulation) {
    const requestedGames = simulation.requestedGames || 0;
    const completedGames = simulation.completedGames || 0;

    if (requestedGames === 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            completedGames /
                requestedGames *
                100
        )
    );
}
