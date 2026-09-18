import { useEffect, useState } from "react";
import Card from "../CardMarket/Card";
import NobleCard from "../NobleGallery/NobleCard";
import PlayerCollectionModal from "../Players/PlayerCollectionModal";
import GameLogPanel from "../GameLog/GameLogPanel";
import { getPermanentDiscounts } from "../../game/getCardPayment";

const TOKEN_COLORS = ["white", "blue", "green", "red", "black", "gold"];
const DISCOUNT_COLORS = ["white", "blue", "green", "red", "black"];

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function totalTokens(player) {
  return sum(Object.values(player.tokens || {}));
}

function cardPoints(player) {
  return sum((player.purchasedCards || []).map((card) => card.points));
}

function noblePoints(player) {
  return sum((player.nobles || []).map((noble) => noble.points));
}

function sortedPlayers(players) {
  return [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.purchasedCards.length - b.purchasedCards.length;
  });
}

function selectFeaturedCards(player, limit) {
  return [...(player.purchasedCards || [])]
    .sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      if ((b.tier || 0) !== (a.tier || 0)) return (b.tier || 0) - (a.tier || 0);
      return sum(Object.values(b.costs || {})) - sum(Object.values(a.costs || {}));
    })
    .slice(0, limit);
}

function strongestDiscount(player) {
  const discounts = getPermanentDiscounts(player);
  return DISCOUNT_COLORS.reduce(
    (best, color) =>
      (discounts[color] || 0) > best.value
        ? { color, value: discounts[color] || 0 }
        : best,
    { color: "white", value: discounts.white || 0 },
  );
}

function GameSummary({ players = [], winners = [], gameLog = [] }) {
  const [showResults, setShowResults] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [collectionPlayer, setCollectionPlayer] = useState(null);
  const standings = sortedPlayers(players);
  const champion = winners[0] || standings[0];
  const winnerNames = new Set(winners.map((winner) => winner.name));
  const finalists = standings.filter((player) => !winnerNames.has(player.name));
  const secondPlace = finalists[0];
  const victoryMargin = secondPlace
    ? Math.max(0, champion.points - secondPlace.points)
    : champion?.points || 0;

  useEffect(() => {
    const timer = setTimeout(() => setShowResults(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!champion || dismissed) return null;

  if (!showResults) {
    return (
      <div className="victory-experience" role="dialog" aria-modal="true">
        <section className="victory-reveal" aria-live="polite">
          <div className="victory-rays" />
          <div className="victory-trophy" aria-hidden="true">🏆</div>
          <p>Royal Treasury Victory</p>
          <h1>Awesome Job!</h1>
          <div className="victory-winner-banner">
            <span>Congratulations</span>
            <strong>{champion.name}</strong>
          </div>
          <small>The Royal Treasury belongs to the new champion.</small>
        </section>
      </div>
    );
  }

  return (
    <div className="victory-experience" role="dialog" aria-modal="true">
      <main className="victory-results">
        <header className="victory-results-header">
          <div>
            <span>The Story of the Match</span>
            <h1>How Victory Was Claimed</h1>
          </div>
          <div className="victory-results-seal">♛</div>
        </header>

        <ChampionShowcase
          player={champion}
          victoryMargin={victoryMargin}
          onViewCollection={() => setCollectionPlayer(champion)}
        />

        <section className="final-standings-section">
          <header>
            <span>Royal Court</span>
            <h2>Final Standings</h2>
          </header>
          <div className="final-standings-grid">
            {finalists.map((player) => {
              const rank = standings.findIndex(
                (rankedPlayer) => rankedPlayer.name === player.name,
              ) + 1;
              return (
                <FinalistCard
                  key={player.name}
                  player={player}
                  rank={rank}
                  onViewCollection={() => setCollectionPlayer(player)}
                />
              );
            })}
          </div>
        </section>

        <section className="victory-timeline-section">
          <header>
            <span>Match Chronicle</span>
            <h2>Game Timeline</h2>
          </header>
          <GameLogPanel gameLog={gameLog} compact />
        </section>
        <button
          type="button"
          className="victory-close-summary"
          onClick={() => setDismissed(true)}
        >
          Close Summary
        </button>
      </main>

      {collectionPlayer && (
        <PlayerCollectionModal
          player={collectionPlayer}
          onClose={() => setCollectionPlayer(null)}
        />
      )}
    </div>
  );
}

function ChampionShowcase({ player, victoryMargin, onViewCollection }) {
  const discount = strongestDiscount(player);
  return (
    <section className="champion-showcase">
      <div className="champion-title-block">
        <span className="champion-crown">♛</span>
        <p>Champion</p>
        <h2>{player.name}</h2>
        <strong>{player.points} Points</strong>
      </div>

      <p className="victory-margin-headline">
        Won by +{victoryMargin} Points
      </p>

      <div className="champion-stat-grid">
        <Stat label="Victory Margin" value={`+${victoryMargin}`} />
        <Stat label="Card Points" value={cardPoints(player)} />
        <Stat label="Noble Points" value={noblePoints(player)} />
        <Stat label="Strongest Discount" value={`${discount.value} ${discount.color}`} />
      </div>

      <FeaturedCollection
        player={player}
        limit={4}
        featured
        onViewCollection={onViewCollection}
      />

      <div className="champion-detail-grid">
        <ResourceSummary
          title="Permanent Discounts"
          values={getPermanentDiscounts(player)}
          colors={DISCOUNT_COLORS}
        />
        <ResourceSummary
          title="Remaining Treasury"
          values={player.tokens || {}}
          colors={TOKEN_COLORS}
        />
      </div>
    </section>
  );
}

function FinalistCard({ player, rank, onViewCollection }) {
  return (
    <article className={`final-player-card final-rank-${rank}`}>
      <div className="final-player-heading">
        <div className="final-player-rank">{rank === 2 ? "Ⅱ" : rank === 3 ? "Ⅲ" : "Ⅳ"}</div>
        <div className="final-player-avatar">{player.name?.slice(0, 1) || "P"}</div>
        <div className="final-player-identity">
          <span>Finalist</span>
          <h3>{player.name}</h3>
        </div>
        <div className="final-player-score">
          <strong>{player.points}</strong>
          <span>Points</span>
        </div>
      </div>

      <div className="final-player-stats">
        <Stat label="Card Points" value={cardPoints(player)} />
        <Stat label="Noble Points" value={noblePoints(player)} />
        <Stat label="Reserved" value={player.reservedCards.length} />
        <Stat label="Tokens" value={totalTokens(player)} />
      </div>

      <FeaturedCollection
        player={player}
        limit={3}
        onViewCollection={onViewCollection}
      />
    </article>
  );
}

function FeaturedCollection({ player, limit, featured = false, onViewCollection }) {
  const cards = selectFeaturedCards(player, limit);
  const nobles = player.nobles || [];
  return (
    <section className={`victory-featured-collection ${featured ? "featured" : ""}`}>
      <div className="victory-featured-heading">
        <div>
          <span>{featured ? "Decisive Cards" : "Match Highlights"}</span>
          <small>{featured ? "The strongest pieces of the winning engine" : "Cards that defined the final position"}</small>
        </div>
        <strong>{player.purchasedCards.length} Total</strong>
      </div>

      <div className="victory-featured-body">
        <div className="victory-featured-card-grid">
          {cards.map((card, index) => (
            <div className="victory-featured-card" key={card.id || `${player.name}-${index}`}>
              <Card
                title={card.title}
                points={card.points}
                bonusColor={card.bonusColor}
                costs={card.costs || {}}
                tier={card.tier || 1}
              />
            </div>
          ))}
        </div>

        <div className="victory-featured-nobles">
          <div className="victory-featured-noble-label">
            <span>Claimed Nobles</span>
          </div>
          {nobles.length > 0 ? (
            <div className="victory-featured-noble-grid">
              {nobles.slice(0, featured ? 3 : 1).map((noble, index) => (
                <div className="victory-featured-noble" key={noble.id || `${player.name}-noble-${index}`}>
                  <NobleCard {...noble} />
                </div>
              ))}
            </div>
          ) : (
            <p>No nobles claimed</p>
          )}
        </div>
      </div>

      <button type="button" className="victory-view-collection" onClick={onViewCollection}>
        View Full Collection
      </button>
    </section>
  );
}

function ResourceSummary({ title, values, colors }) {
  return (
    <section className="victory-resource-panel">
      <h3>{title}</h3>
      <div className="victory-resource-row">
        {colors.map((color) => (
          <div className={`victory-gem victory-gem-${color}`} key={color}>
            <span />
            <strong>{values[color] || 0}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="victory-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default GameSummary;
