import { useStoredSetting } from "../../settings/settingsStore";
import "./SettingsScreen.css";

function SettingsScreen() {
  const [showPersonalities, setShowPersonalities] = useStoredSetting(
    "showPersonalities",
    true,
  );
  const [soundEnabled, setSoundEnabled] = useStoredSetting(
    "soundEnabled",
    false,
  );
  const [musicEnabled, setMusicEnabled] = useStoredSetting(
    "musicEnabled",
    true,
  );
  const [masterVolume, setMasterVolume] = useStoredSetting(
    "masterVolume",
    0.72,
  );
  const [effectsVolume, setEffectsVolume] = useStoredSetting(
    "effectsVolume",
    0.82,
  );
  const [musicVolume, setMusicVolume] = useStoredSetting(
    "musicVolume",
    0.34,
  );

  return (
    <section className="settings-screen">
      <header className="settings-screen-heading">
        <p>Preferences</p>
        <h1>Settings</h1>
        <span>Gameplay and audio preferences are saved locally.</span>
      </header>

      <div className="settings-screen-layout">
        <SettingsGroup title="Gameplay">
          <SettingToggle
            label="Show AI Personalities"
            description="Display each AI strategy on Player Treasury cards."
            checked={showPersonalities}
            onChange={setShowPersonalities}
          />
        </SettingsGroup>

        <SettingsGroup title="Royal Audio">
          <SettingToggle
            label="Sound Effects"
            description="Enable interface, gameplay, ceremony, countdown, and victory sounds."
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
          <SettingToggle
            label="Background Music"
            description="Play an original ambient royal theme throughout the game."
            checked={musicEnabled}
            onChange={setMusicEnabled}
            disabled={!soundEnabled}
          />
          <VolumeControl
            label="Master Volume"
            value={masterVolume}
            onChange={setMasterVolume}
            disabled={!soundEnabled}
          />
          <VolumeControl
            label="Effects Volume"
            value={effectsVolume}
            onChange={setEffectsVolume}
            disabled={!soundEnabled}
          />
          <VolumeControl
            label="Music Volume"
            value={musicVolume}
            onChange={setMusicVolume}
            disabled={!soundEnabled || !musicEnabled}
          />
        </SettingsGroup>
      </div>
    </section>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <section className="settings-screen-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label
      className={`settings-screen-toggle ${disabled ? "is-disabled" : ""}`}
    >
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function VolumeControl({ label, value, onChange, disabled }) {
  const percent = Math.round(value * 100);

  return (
    <label
      className={`settings-screen-volume ${disabled ? "is-disabled" : ""}`}
    >
      <span>
        <strong>{label}</strong>
        <small>{percent}%</small>
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default SettingsScreen;
