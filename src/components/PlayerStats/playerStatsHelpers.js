export function getMatchupLabel(value) {
  return ({
    humanVsAi: "Human vs. AI",
    humanVsHuman: "Human vs. Human",
    mixed: "Mixed Match",
  })[value] || value || "Unknown";
}

const COLORS = ["white", "blue", "green", "red", "black", "gold"];

function average(total, count) {
  return count ? Number((total / count).toFixed(2)) : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2));
}

function getPersonalSnapshot(game, profile) {
  return (game.players || []).find((player) =>
    player.profileId
      ? player.profileId === profile.id
      : String(player.name || "").toLowerCase() === profile.displayName.toLowerCase(),
  );
}

function calculateStreak(results, target) {
  let streak = 0;
  for (const result of results) {
    if (result === target) streak += 1;
    else break;
  }
  return streak;
}

function longestWinningStreak(results) {
  let current = 0;
  let longest = 0;
  for (const result of [...results].reverse()) {
    current = result === "win" ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function buildPlayerStatistics(analytics, profile) {
  const resetTime = profile.statsResetAt
    ? new Date(profile.statsResetAt).getTime()
    : 0;
  const matches = (analytics.matchHistory || [])
    .filter((game) => {
      if (!resetTime) return true;
      const completedTime = game.completedAt
        ? new Date(game.completedAt).getTime()
        : 0;
      return completedTime > resetTime;
    })
    .map((game) => ({ game, player: getPersonalSnapshot(game, profile) }))
    .filter((entry) => entry.player);
  const results = matches.map(({ player }) =>
    player.isWinner ? (player.sharedVictory ? "shared" : "win") : "loss",
  );
  const wins = results.filter((result) => result === "win" || result === "shared").length;
  const sharedWins = results.filter((result) => result === "shared").length;
  const losses = matches.length - wins;
  const scores = matches.map(({ player }) => player.points || 0);
  const purchased = matches.map(({ player }) => player.purchasedCards || 0);
  const reserved = matches.map(({ player }) => player.reservedCards || 0);
  const nobles = matches.map(({ player }) => player.nobles || 0);
  const turns = matches.map(({ game }) => game.turnCount || 0);
  const victoryMargins = matches
    .filter(({ player }) => player.isWinner)
    .map(({ player }) => player.victoryMargin || 0);
  const seatStats = [1, 2, 3, 4].map((seat) => {
    const seated = matches.filter(({ player }) => player.seat === seat);
    const seatWins = seated.filter(({ player }) => player.isWinner).length;
    return { seat, games: seated.length, wins: seatWins, winRate: average(seatWins * 100, seated.length) };
  });
  const opponentRecords = new Map();
  for (const { game, player } of matches) {
    for (const opponent of game.players || []) {
      if (opponent === player || opponent.profileId === profile.id || opponent.name === player.name) continue;
      const key = opponent.personalityName || opponent.name || "Unknown";
      const record = opponentRecords.get(key) || { name: key, games: 0, wins: 0 };
      record.games += 1;
      if (player.isWinner) record.wins += 1;
      opponentRecords.set(key, record);
    }
  }
  const colors = Object.fromEntries(COLORS.map((color) => [color, 0]));
  for (const { player } of matches) {
    for (const color of COLORS) colors[color] += player.finalDiscounts?.[color] || 0;
  }
  function achievementDate(predicate) {
    const earned = [...matches]
      .reverse()
      .find((entry, index, history) => predicate(entry, index, history));
    return earned?.game.completedAt || null;
  }

  const chronological = [...matches].reverse();
  const cumulative = chronological.reduce(
    (rows, entry) => {
      const previous = rows.at(-1) || { wins: 0, streak: 0, seatWins: new Set() };
      const won = entry.player.isWinner;
      rows.push({
        entry,
        wins: previous.wins + (won ? 1 : 0),
        streak: won ? previous.streak + 1 : 0,
        seatWins: new Set([
          ...previous.seatWins,
          ...(won && entry.player.seat ? [entry.player.seat] : []),
        ]),
      });
      return rows;
    },
    [],
  );

  const achievements = [
    {
      id: "first-win",
      title: "First Victory",
      unlockedAt: achievementDate(({ player }) => player.isWinner),
    },
    {
      id: "ten-wins",
      title: "Royal Veteran",
      unlockedAt: cumulative.find((row) => row.wins >= 10)?.entry.game.completedAt || null,
    },
    {
      id: "twenty-score",
      title: "Twenty Point Treasury",
      unlockedAt: achievementDate(({ player }) => (player.points || 0) >= 20),
    },
    {
      id: "noble-collector",
      title: "Noble Collector",
      unlockedAt: achievementDate(({ player }) => (player.nobles || 0) >= 3),
    },
    {
      id: "card-magnate",
      title: "Card Magnate",
      unlockedAt: achievementDate(({ player }) => (player.purchasedCards || 0) >= 20),
    },
    {
      id: "seat-master",
      title: "Master of Every Seat",
      unlockedAt: cumulative.find((row) => row.seatWins.size >= 4)?.entry.game.completedAt || null,
    },
    {
      id: "streak-five",
      title: "Five Game Reign",
      unlockedAt: cumulative.find((row) => row.streak >= 5)?.entry.game.completedAt || null,
    },
    {
      id: "close-win",
      title: "By a Single Point",
      unlockedAt: achievementDate(({ player }) => player.isWinner && player.victoryMargin === 1),
    },
  ].map((achievement) => ({
    ...achievement,
    unlocked: Boolean(achievement.unlockedAt),
  }));

  return {
    profile,
    matches,
    overview: {
      games: matches.length,
      wins,
      losses,
      sharedWins,
      winRate: average(wins * 100, matches.length),
      currentWinStreak: calculateStreak(results, "win"),
      longestWinStreak: longestWinningStreak(results),
      totalTurns: turns.reduce((sum, value) => sum + value, 0),
      averageTurns: average(turns.reduce((sum, value) => sum + value, 0), turns.length),
    },
    scoring: {
      totalPoints: scores.reduce((sum, value) => sum + value, 0),
      averageScore: average(scores.reduce((sum, value) => sum + value, 0), scores.length),
      medianScore: median(scores),
      highestScore: Math.max(0, ...scores),
      lowestScore: scores.length ? Math.min(...scores) : 0,
      largestVictoryMargin: Math.max(0, ...victoryMargins),
    },
    collection: {
      totalPurchased: purchased.reduce((sum, value) => sum + value, 0),
      averagePurchased: average(purchased.reduce((sum, value) => sum + value, 0), purchased.length),
      mostPurchased: Math.max(0, ...purchased),
      totalReserved: reserved.reduce((sum, value) => sum + value, 0),
      averageReserved: average(reserved.reduce((sum, value) => sum + value, 0), reserved.length),
      totalNobles: nobles.reduce((sum, value) => sum + value, 0),
      averageNobles: average(nobles.reduce((sum, value) => sum + value, 0), nobles.length),
      mostNobles: Math.max(0, ...nobles),
      lifetimeDiscounts: colors,
    },
    seatStats,
    opponents: [...opponentRecords.values()].map((record) => ({
      ...record,
      winRate: average(record.wins * 100, record.games),
    })).sort((a, b) => b.games - a.games),
    achievements,
  };
}
