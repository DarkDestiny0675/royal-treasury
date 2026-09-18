import "./CreditsScreen.css";

function CreditsScreen({ onBack }) {
  return (
    <section className="credits-screen">
      <article className="credits-card">
        <header className="credits-heading">
          <p>Royal Archive</p>
          <h1>Royal Treasury</h1>
          <span>Version 1.0</span>
        </header>

        <div className="credits-grid">
          <CreditsSection title="Creator">
            <strong>Michael Eilers</strong>
            <p>Game Design, Product Vision, Gameplay Direction, and Quality Assurance</p>
          </CreditsSection>

          <CreditsSection title="Development Collaboration">
            <strong>Microsoft Copilot</strong>
            <p>Architecture Guidance, UI and UX Collaboration, Systems Design Support, and Documentation</p>
          </CreditsSection>

          <CreditsSection title="Major Systems">
            <ul>
              <li>Core Gameplay Engine</li>
              <li>Artificial Intelligence Opponents</li>
              <li>Royal Seating and Countdown Experiences</li>
              <li>Interactive Tutorial</li>
              <li>Player Statistics and Achievements</li>
              <li>Admin Analytics and AI Laboratory</li>
              <li>Save and Resume Framework</li>
              <li>Sound and Music System</li>
            </ul>
          </CreditsSection>

          <CreditsSection title="The Royal Court">
            <p>Lady Seraphina, Prince Leopold, and the complete Noble Court of Royal Treasury.</p>
          </CreditsSection>
        </div>

        <blockquote>
          “A treasury is built one gem at a time, but a legacy is built through choices.”
        </blockquote>

        <button type="button" className="credits-close-button" onClick={onBack}>
          Close
        </button>
      </article>
    </section>
  );
}

function CreditsSection({ title, children }) {
  return (
    <section className="credits-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default CreditsScreen;
