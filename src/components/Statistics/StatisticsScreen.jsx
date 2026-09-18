import { useMemo, useState } from "react";
import HallOfFameSection from "./HallOfFameSection";
import LeaderboardSection from "./LeaderboardSection";
import MatchHistorySection from "./MatchHistorySection";
import OverviewSection from "./OverviewSection";
import PersonalityDetailsSection from "./PersonalityDetailsSection";
import { buildStatistics } from "./statisticsHelpers";

function StatisticsScreen({ analytics }) {
  const statistics = useMemo(
    () => buildStatistics(analytics),
    [analytics],
  );

  const [selectedPersonalityId, setSelectedPersonalityId] = useState(
    statistics.rankedPersonalities[0]?.id || "builder",
  );

  const selectedPersonality = statistics.personalities.find(
    (personality) => personality.id === selectedPersonalityId,
  );

  return (
    <section className="statistics-screen">
      <header className="statistics-screen-header">
        <div>
          <p className="statistics-eyebrow">Royal Treasury Records</p>
          <h1>Statistics</h1>
          <span>Game history and AI personality performance</span>
        </div>
      </header>

      <OverviewSection overview={statistics.overview} />

      <div className="statistics-two-column">
        <LeaderboardSection
          personalities={statistics.rankedPersonalities}
          selectedId={selectedPersonalityId}
          onSelect={setSelectedPersonalityId}
        />
        <PersonalityDetailsSection personality={selectedPersonality} />
      </div>

      <HallOfFameSection records={statistics.hallOfFame} />
      <MatchHistorySection history={statistics.history} />
    </section>
  );
}

export default StatisticsScreen;
