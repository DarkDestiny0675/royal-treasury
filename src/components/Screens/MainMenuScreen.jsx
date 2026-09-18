import "./MainMenuScreen.css";

const HERO_NOBLES = {
  leopold: {
    name: "Prince Leopold",
    image: "/images/nobles/prince-leopold.png",
  },
  seraphina: {
    name: "Lady Seraphina",
    image: "/images/nobles/lady-seraphina.png",
  },
};

function MainMenuScreen({
  onContinue,
  onNewGame,
  onOnlineGame,
  onDeleteSave,
  onStatistics,
  onSettings,
  onCredits,
  gamesPlayed,
  canContinue,
  saveSummary,
}) {
  return (
    <section className="main-menu-screen">
      <div className="main-menu-hero">
        <div className="main-menu-copy">
          <p className="screen-eyebrow">A Strategic Gem-Building Experience</p>
          <h1>Royal Treasury</h1>
          <p className="main-menu-tagline">
            Build a lasting engine, earn the favor of nobles, and shape a
            treasury worthy of victory.
          </p>
          <div className="main-menu-actions">
            <button
              type="button"
              className="primary-menu-action"
              onClick={onNewGame}
            >
              Start Local Game
            </button>
            <button
              type="button"
              className="primary-menu-action"
              onClick={onOnlineGame}
            >
              Play Online
            </button>
            <button
              type="button"
              className="secondary-menu-action"
              disabled={!canContinue}
              onClick={onContinue}
            >
              Load Saved Game
            </button>
          </div>
          <div className="main-menu-meta">
            <span>{gamesPlayed} recorded matches</span>
            <span>4 AI personalities</span>
            <span>Procedural content</span>
          </div>
        </div>
        <div
          className="main-menu-art noble-hero-art"
          aria-label="Featured Royal Treasury Nobles"
        >
          <div className="hero-art-glow" aria-hidden="true" />
          <HeroNoble
            noble={HERO_NOBLES.leopold}
            className="hero-noble-leopold"
          />
          <HeroNoble
            noble={HERO_NOBLES.seraphina}
            className="hero-noble-seraphina"
          />
        </div>
      </div>
      <div className="main-menu-grid public-menu-grid">
        <MenuCard
          kicker="Records"
          title="Player Stats"
          description="Review your personal matches, achievements, records, and performance."
          onClick={onStatistics}
        />
        <MenuCard
          kicker="Preferences"
          title="Settings"
          description="Control gameplay display and future sound options."
          onClick={onSettings}
        />
        <MenuCard
          kicker="Royal Archive"
          title="Credits"
          description="View the game credits and creative acknowledgements."
          onClick={onCredits}
        />
      </div>
      <section className="session-summary-card">
        <span>{canContinue ? "◆" : "◇"} Current Session</span>
        <h3>{canContinue ? saveSummary.sessionName : "No Saved Game"}</h3>
        <p>
          {canContinue
            ? "Resume the saved match from the exact turn where play stopped."
            : "Start a match and use Save Game from the board to create a resumable session."}
        </p>
        {canContinue && (
          <div className="session-summary-actions">
            <button type="button" onClick={onContinue}>
              Load Game
            </button>
            <button type="button" onClick={onDeleteSave}>
              Delete Save
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

function HeroNoble({ noble, className }) {
  return (
    <figure className={`hero-noble-card ${className}`}>
      <img src={noble.image} alt={`${noble.name} Noble card`} />
      <figcaption>{noble.name}</figcaption>
    </figure>
  );
}

function MenuCard({ kicker, title, description, onClick }) {
  return (
    <button type="button" className="menu-feature-card" onClick={onClick}>
      <span>{kicker}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      <em>Open</em>
    </button>
  );
}

export default MainMenuScreen;
