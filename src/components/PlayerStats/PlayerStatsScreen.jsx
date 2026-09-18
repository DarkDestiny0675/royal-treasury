import { useMemo, useState } from "react";
import { clearPlayerStatistics } from "../../settings/playerProfileStore";
import { buildPlayerStatistics } from "./playerStatsHelpers";
import ArchivedMatchViewer from "../Statistics/ArchivedMatchViewer";
import "./PlayerStatsScreen.css";

const TABS = [
  ["overview", "Overview"], ["scoring", "Scoring"],
  ["collection", "Collection"], ["opponents", "Opponents"],
  ["seating", "Seating"], ["achievements", "Achievements"],
  ["history", "Match History"],
];

function formatAchievementDate(value) {
  if (!value) return "Not yet earned";
  return `Earned ${new Date(value).toLocaleDateString([], {
    year: "numeric", month: "short", day: "numeric",
  })}`;
}

function PlayerStatsScreen({ analytics, profile }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showReset, setShowReset] = useState(false);
  const [resetText, setResetText] = useState("");
  const stats = useMemo(
    () => buildPlayerStatistics(analytics, profile),
    [analytics, profile],
  );

  function confirmReset(event) {
    event.preventDefault();
    if (resetText !== "RESET") return;
    clearPlayerStatistics();
    setResetText("");
    setShowReset(false);
    setActiveTab("overview");
  }

  return (
    <section className="player-stats-screen">
      <header className="player-stats-hero">
        <div className="player-stats-avatar">{profile.displayName.slice(0, 1)}</div>
        <div><p>Personal Royal Record</p><h1>{profile.displayName}'s Player Stats</h1><span>Private statistics stored for this player profile on this device.</span></div>
        <div className="player-stats-rank"><strong>{stats.overview.wins}</strong><span>Victories</span></div>
      </header>

      <nav className="player-stats-tabs" aria-label="Player statistics sections">
        {TABS.map(([id, label]) => <button type="button" key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>{label}</button>)}
      </nav>

      {stats.matches.length === 0 ? (
        <section className="player-stats-empty"><strong>No personal matches recorded yet</strong><p>Complete a game with {profile.displayName} as the local human player to begin the record.</p></section>
      ) : <PlayerStatsPage tab={activeTab} stats={stats} />}

      <section className="player-stats-maintenance">
        <div><span>Player Profile Maintenance</span><strong>Clear Personal Statistics</strong><p>Erase this profile's personal record without changing global Admin analytics.</p></div>
        <button type="button" onClick={() => setShowReset(true)}>Clear My Stats</button>
      </section>

      {showReset && (
        <div className="player-reset-overlay" onClick={() => setShowReset(false)}>
          <form className="player-reset-modal" onSubmit={confirmReset} onClick={(event) => event.stopPropagation()}>
            <span className="player-reset-warning">!</span>
            <p>Permanent Profile Action</p>
            <h2>Clear {profile.displayName}'s Statistics?</h2>
            <strong>This will clear the personal view for this profile:</strong>
            <ul><li>Win and loss record</li><li>Scoring and collection records</li><li>Opponent and seating records</li><li>Achievements and personal match history</li></ul>
            <small>Global Admin analytics and AI records will remain unchanged.</small>
            <label htmlFor="reset-confirmation">Type <b>RESET</b> to confirm</label>
            <input id="reset-confirmation" value={resetText} autoFocus autoComplete="off" onChange={(event) => setResetText(event.target.value)} />
            <div className="player-reset-actions"><button type="button" onClick={() => setShowReset(false)}>Cancel</button><button type="submit" disabled={resetText !== "RESET"}>Clear Statistics</button></div>
          </form>
        </div>
      )}
    </section>
  );
}

function PlayerStatsPage({ tab, stats }) {
  if (tab === "overview") return <Overview stats={stats} />;
  if (tab === "scoring") return <Scoring stats={stats} />;
  if (tab === "collection") return <Collection stats={stats} />;
  if (tab === "opponents") return <Opponents stats={stats} />;
  if (tab === "seating") return <Seating stats={stats} />;
  if (tab === "achievements") return <Achievements stats={stats} />;
  return <History stats={stats} />;
}
function Overview({ stats }) { const o=stats.overview; return <StatsSection title="Career Overview"><StatGrid items={[["Games Played",o.games],["Victories",o.wins],["Losses",o.losses],["Shared Victories",o.sharedWins],["Win Rate",`${o.winRate}%`],["Current Streak",o.currentWinStreak],["Longest Reign",o.longestWinStreak],["Total Turns",o.totalTurns],["Average Turns",o.averageTurns]]}/></StatsSection>; }
function Scoring({ stats }) { const s=stats.scoring; return <StatsSection title="Scoring Performance"><StatGrid items={[["Lifetime Points",s.totalPoints],["Average Score",s.averageScore],["Median Score",s.medianScore],["Highest Score",s.highestScore],["Lowest Score",s.lowestScore],["Largest Victory Margin",s.largestVictoryMargin]]}/></StatsSection>; }
function Collection({ stats }) { const c=stats.collection; return <><StatsSection title="Collection Performance"><StatGrid items={[["Cards Purchased",c.totalPurchased],["Average Purchased",c.averagePurchased],["Most Purchased",c.mostPurchased],["Cards Reserved",c.totalReserved],["Average Reserved",c.averageReserved],["Nobles Claimed",c.totalNobles],["Average Nobles",c.averageNobles],["Most Nobles",c.mostNobles]]}/></StatsSection><StatsSection title="Lifetime Permanent Discounts"><div className="player-color-grid">{Object.entries(c.lifetimeDiscounts).map(([color,value])=><div className={`player-color-stat color-${color}`} key={color}><span>{color}</span><strong>{value}</strong></div>)}</div></StatsSection></>; }
function Opponents({ stats }) { return <StatsSection title="Opponent Records"><div className="player-list-table"><div className="player-list-header"><span>Opponent</span><span>Games</span><span>Wins</span><span>Win Rate</span></div>{stats.opponents.map((item)=><div className="player-list-row" key={item.name}><strong>{item.name}</strong><span>{item.games}</span><span>{item.wins}</span><span>{item.winRate}%</span></div>)}</div></StatsSection>; }
function Seating({ stats }) { return <StatsSection title="Seating Performance"><div className="seat-performance-grid">{stats.seatStats.map((seat)=><article key={seat.seat}><span>Seat {seat.seat}</span><strong>{seat.winRate}%</strong><small>{seat.wins} wins in {seat.games} games</small></article>)}</div></StatsSection>; }
function Achievements({ stats }) { return <StatsSection title="Royal Achievements"><div className="achievement-grid">{stats.achievements.map((achievement)=><article className={achievement.unlocked?"unlocked":"locked"} key={achievement.id}><span>{achievement.unlocked?"◆":"◇"}</span><strong>{achievement.title}</strong><small>{formatAchievementDate(achievement.unlockedAt)}</small></article>)}</div></StatsSection>; }
function History({ stats }) { const [selectedGame,setSelectedGame]=useState(null); return <><StatsSection title="Personal Match History"><div className="player-history"><div className="player-history-header"><span>Game</span><span>Result</span><span>Score</span><span>Seat</span><span>Turns</span><span>Opponents</span></div>{stats.matches.map(({game,player})=><button type="button" className="player-history-row" key={`${game.gameNumber}-${game.completedAt}`} onClick={()=>setSelectedGame(game)}><span>#{game.gameNumber}</span><strong>{player.isWinner?"Victory":"Defeat"}</strong><span>{player.points}</span><span>{player.seat||"-"}</span><span>{game.turnCount}</span><span>{(game.players||[]).filter((item)=>item.name!==player.name).map((item)=>item.name).join(", ")}</span></button>)}</div></StatsSection>{selectedGame&&<ArchivedMatchViewer game={selectedGame} onClose={()=>setSelectedGame(null)}/>}</>; }
function StatsSection({title,children}) { return <section className="player-stats-section"><h2>{title}</h2>{children}</section>; }
function StatGrid({items}) { return <div className="player-stat-grid">{items.map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>; }
export default PlayerStatsScreen;
