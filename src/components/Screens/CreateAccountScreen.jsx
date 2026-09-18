import { useState } from "react";
import { saveAuthSession } from "../../auth/authSession";
import { registerAccount } from "../../services/authApi";
import "./CreateAccountScreen.css";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

function PasswordField({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(true);
  return (
    <label className="create-account-field">
      <span>{label}</span>
      <div className="create-account-password-control">
        <input
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          minLength={8}
          required
        />
        <button
          type="button"
          className="create-account-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? "👁" : "👁‍🗨"}
        </button>
      </div>
    </label>
  );
}

function CreateAccountScreen({ onAuthenticated, onBack }) {
  const [form, setForm] = useState({ username: "", firstName: "", lastName: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (!USERNAME_PATTERN.test(form.username)) {
      setMessage("Username must be 3-20 characters using letters, numbers, or underscores.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage("The password entries do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const session = await registerAccount({
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });
      saveAuthSession(session, false);
      onAuthenticated(session.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="create-account-screen">
      <form className="create-account-card" onSubmit={submit}>
        <header className="create-account-heading">
          <p>Royal Treasury Online</p>
          <h1>Create Your Account</h1>
          <span>Your in-game name will display as First Name and Last Initial.</span>
        </header>

        <div className="create-account-grid">
          <label className="create-account-field create-account-wide">
            <span>Username</span>
            <input
              autoComplete="username"
              maxLength={20}
              pattern="[A-Za-z0-9_]{3,20}"
              title="3-20 letters, numbers, or underscores"
              value={form.username}
              onChange={(event) => update("username", event.target.value)}
              required
              autoFocus
            />
            <small>3-20 letters, numbers, or underscores</small>
          </label>

          <label className="create-account-field">
            <span>First Name</span>
            <input autoComplete="given-name" maxLength={40} value={form.firstName} onChange={(event) => update("firstName", event.target.value)} required />
          </label>

          <label className="create-account-field">
            <span>Last Name</span>
            <input autoComplete="family-name" maxLength={40} value={form.lastName} onChange={(event) => update("lastName", event.target.value)} required />
          </label>

          <PasswordField label="Password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" />
          <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" />
        </div>

        {message && <div className="create-account-message" role="alert">{message}</div>}

        <div className="create-account-actions">
          <button type="button" className="create-account-secondary" onClick={onBack}>Back to Sign In</button>
          <button type="submit" className="create-account-primary" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateAccountScreen;
