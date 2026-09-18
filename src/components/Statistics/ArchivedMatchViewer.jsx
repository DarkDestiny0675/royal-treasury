import "./ArchivedMatchViewer.css";
import { getMatchupLabel } from "./statisticsHelpers";

const COLORS = ["white", "blue", "green", "red", "black", "gold"];
function cardName(card) { return card?.title || card?.name || "Unnamed card"; }
function PlayerArchive({ player }) {
  return <article className="archive-player-card">
    <header><strong>{player.name}</strong><span>{player.points || 0} VP</span></header>
    <p>{player.type === "ai" ? player.personalityId || "AI" : "Human"}</p>
    <div className="archive-token-row">{COLORS.map((color) => <span key={color}>{color}: {player.tokens?.[color] || 0}</span>)}</div>
    <small>Purchased: {(player.purchasedCards || []).map(cardName).join(", ") || "None"}</small>
    <small>Reserved: {(player.reservedCards || []).map(cardName).join(", ") || "None"}</small>
    <small>Nobles: {(player.nobles || []).map((noble) => noble.name || "Noble").join(", ") || "None"}</small>
  </article>;
}
function Market({ title, cards }) {
  return <section className="archive-market"><h3>{title}</h3><div>{(cards || []).map((card) => <span key={card.id || cardName(card)}>{cardName(card)} · {card.points || 0} VP</span>)}</div></section>;
}
function ArchivedMatchViewer({ game, onClose }) {
  if (!game) return null;
  const board = game.finalBoard;
  return <div className="archive-viewer-overlay" onClick={onClose}>
    <section className="archive-viewer" role="dialog" aria-modal="true" aria-labelledby="archive-title" onClick={(event) => event.stopPropagation()}>
      <header className="archive-viewer-header"><div><p>Archived Match</p><h2 id="archive-title">Game #{game.gameNumber}</h2><span>{new Date(game.completedAt).toLocaleString()}</span></div><button type="button" onClick={onClose}>Close</button></header>
      <div className="archive-summary"><article><span>Winner</span><strong>{(game.winnerNames || []).join(" & ")}</strong></article><article><span>Winning Score</span><strong>{game.winningScore}</strong></article><article><span>Turns</span><strong>{game.turnCount}</strong></article><article><span>Matchup</span><strong>{getMatchupLabel(game.matchupType)}</strong></article></div>
      <section className="archive-section"><h3>Final Standings</h3><div className="archive-standings">{[...(game.players || [])].sort((a,b) => b.points-a.points || a.purchasedCards-b.purchasedCards).map((player,index) => <article key={`${player.name}-${index}`}><b>#{index+1}</b><strong>{player.name}</strong><span>{player.points} VP</span><small>{player.purchasedCards} cards · {player.nobles} nobles</small></article>)}</div></section>
      {board ? <><section className="archive-section"><h3>Final Player Collections</h3><div className="archive-player-grid">{(board.players || []).map((player) => <PlayerArchive key={player.id || player.name} player={player} />)}</div></section><section className="archive-section"><h3>Final Board</h3><div className="archive-bank">{COLORS.map((color) => <span key={color}>{color}: {board.bank?.[color] || 0}</span>)}</div><Market title="Tier 3 Market" cards={board.tier3Market}/><Market title="Tier 2 Market" cards={board.tier2Market}/><Market title="Tier 1 Market" cards={board.tier1Market}/><Market title="Available Nobles" cards={board.availableNobles}/></section></> : <p className="archive-unavailable">Final board details were not stored for this older match.</p>}
      <section className="archive-section"><h3>Game Log</h3>{(game.gameLog || []).length ? <div className="archive-log">{game.gameLog.map((entry,index) => <article key={entry.id || index}><b>Turn {entry.turn}</b><strong>{entry.playerName}</strong><span>{entry.action}</span></article>)}</div> : <p className="archive-unavailable">A game log was not stored for this older match.</p>}</section>
    </section>
  </div>;
}
export default ArchivedMatchViewer;
