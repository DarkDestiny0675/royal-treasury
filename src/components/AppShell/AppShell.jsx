const PUBLIC_NAVIGATION = [
  { id: "menu", label: "Home" },
  { id: "playerStats", label: "Player Stats" },
  { id: "community", label: "Community" },
  { id: "tutorial", label: "Tutorial" },
  { id: "settings", label: "Settings" },
  { id: "credits", label: "Credits" },
];

function AppShell({
  activeScreen,
  onNavigate,
  onAdminAccess,
  onSaveGame,
  canSaveGame,
  saveStatus = "idle",
  adminUnlocked,
  welcomeName = "",
  welcomeRole = "",
  showGameNavigation = false,
  gameNavigationTarget = "game",
  children,
}) {
  const saveButtonState = {
    idle: { label: "Save Game", className: "idle" },
    saving: { label: "Saving...", className: "saving" },
    saved: { label: "✓ Saved", className: "saved" },
    failed: { label: "✕ Save Failed", className: "failed" },
  }[saveStatus] || { label: "Save Game", className: "idle" };
  const saveInProgress = saveStatus === "saving";
  const navigation = showGameNavigation
    ? [
        PUBLIC_NAVIGATION[0],
        { id: gameNavigationTarget, label: "Game Board" },
        ...PUBLIC_NAVIGATION.slice(1),
      ]
    : PUBLIC_NAVIGATION;

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <button
          type="button"
          className="app-brand"
          onClick={() => onNavigate("menu")}
        >
          <strong>RT</strong>
          <span>
            <b>Royal Treasury</b>
            <small>Strategy in every gem.</small>
            {welcomeName && (
              <em className="app-welcome">
                Welcome, {welcomeName}{welcomeRole ? ` - ${welcomeRole}` : ""}
              </em>
            )}
          </span>
        </button>

        <nav className="app-navigation" aria-label="Primary navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeScreen === item.id ? "active" : ""}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="app-shell-actions">
          {onSaveGame && (
            <button
              type="button"
              className={`save-game-button ${saveButtonState.className}`}
              disabled={!canSaveGame || saveInProgress}
              onClick={onSaveGame}
              aria-live="polite"
            >
              {saveButtonState.label}
            </button>
          )}

          <button
            type="button"
            className={`admin-entry-button ${
              adminUnlocked ? "unlocked" : "locked"
            }`}
            onClick={onAdminAccess}
          >
            <span aria-hidden="true">{adminUnlocked ? "◆" : "◇"}</span>
            {adminUnlocked ? "Admin Unlocked" : "Admin"}
          </button>
        </div>
      </header>

      <main className="app-shell-content">{children}</main>
    </div>
  );
}

export default AppShell;
