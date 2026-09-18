import { useState } from "react";
import ArchivedMatchViewer from "./ArchivedMatchViewer";
function MatchHistorySection({ history }) {
  const [selectedGame,setSelectedGame]=useState(null);
  return <section className="statistics-section"><h2>Match History</h2><div className="statistics-history-table"><div className="statistics-history-header"><span>Game</span><span>Winner</span><span>Personality</span><span>Score</span><span>Turns</span></div>{history.length===0?<p className="statistics-empty">No completed games recorded.</p>:history.slice(0,100).map((game)=><button type="button" key={game.gameNumber} className="statistics-history-row" onClick={()=>setSelectedGame(game)}><span>{game.gameNumber}</span><strong>{game.winnerNames.join(" and ")}</strong><span>{game.winnerPersonalities.join(" and ")}</span><span>{game.winningScore}</span><span>{game.turnCount}</span></button>)}</div>{selectedGame&&<ArchivedMatchViewer game={selectedGame} onClose={()=>setSelectedGame(null)}/>}</section>;
}
export default MatchHistorySection;
