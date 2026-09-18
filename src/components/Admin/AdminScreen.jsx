import "./AdminMode.css";

function AdminScreen({
  onOpenAiLaboratory,
  onOpenGameAnalytics,
  onLock,
  onBack,
}) {
  return (
    <section className="screen-panel admin-screen">
      <header className="screen-heading admin-screen-heading">
        <div>
          <p>Restricted Tools</p>
          <h1>Administrator Console</h1>
          <span>Development, balancing, and global game records.</span>
        </div>
        <span className="admin-unlocked-badge">Unlocked</span>
      </header>
      <div className="admin-tool-grid">
        <button
          type="button"
          className="admin-tool-card"
          onClick={onOpenAiLaboratory}
        >
          <span>AI Development</span>
          <strong>AI Laboratory</strong>
          <p>Run simulations and review personality balancing analytics.</p>
          <em>Open Laboratory</em>
        </button>
        <button
          type="button"
          className="admin-tool-card"
          onClick={onOpenGameAnalytics}
        >
          <span>Global Records</span>
          <strong>Game Analytics</strong>
          <p>
            Review all matches, AI leaderboards, global Hall of Fame, and
            complete history.
          </p>
          <em>Open Analytics</em>
        </button>
      </div>
      <div className="screen-footer-actions">
        <button
          type="button"
          className="secondary-menu-action"
          onClick={onBack}
        >
          Back
        </button>
        <button type="button" className="admin-lock-button" onClick={onLock}>
          Lock Admin Mode
        </button>
      </div>
    </section>
  );
}
export default AdminScreen;
