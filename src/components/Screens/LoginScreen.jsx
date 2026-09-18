import { useState } from "react";
import { saveAuthSession } from "../../auth/authSession";
import { loginAccount } from "../../services/authApi";
import "./LoginScreen.css";

function LoginScreen({ onAuthenticated, onCreateAccount, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const session = await loginAccount({ username, password, rememberMe });
      saveAuthSession(session, rememberMe);
      onAuthenticated(session.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <header className="login-heading">
          <p>Royal Treasury Online</p>
          <h1>Enter the Great Hall</h1>
          <span>Sign in to join rooms, play online, and build your record.</span>
        </header>

        <label className="login-field">
          <span>Username</span>
          <input
            autoComplete="username"
            maxLength={20}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="login-field">
          <span>Password</span>
          <div className="login-password-control">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁" : "👁‍🗨"}
            </button>
          </div>
        </label>

        <label className="login-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Remember me on this device</span>
        </label>

        {message && <div className="login-message" role="alert">{message}</div>}

        <div className="login-actions">
          <button type="button" className="login-secondary" onClick={onBack}>Back</button>
          <button type="submit" className="login-primary" disabled={submitting}>
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </div>

        <button type="button" className="login-create-link" onClick={onCreateAccount}>
          New to Royal Treasury? Create an account
        </button>
      </form>
    </section>
  );
}

export default LoginScreen;
