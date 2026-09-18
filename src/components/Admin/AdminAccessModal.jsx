import { useState } from "react";
import { unlockAdmin } from "../../settings/adminStore";
import "./AdminMode.css";

function AdminAccessModal({ onClose, onUnlocked }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!unlockAdmin(code)) {
      setError("Incorrect administrator code.");
      setCode("");
      return;
    }
    onUnlocked();
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <form className="admin-access-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <span className="admin-lock-mark">◆</span>
        <p>Restricted Access</p>
        <h2>Administrator</h2>
        <label htmlFor="admin-code">Admin Code</label>
        <input
          id="admin-code"
          type="password"
          value={code}
          autoFocus
          autoComplete="off"
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
        />
        {error && <strong className="admin-access-error">{error}</strong>}
        <div className="admin-modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Unlock Admin</button>
        </div>
      </form>
    </div>
  );
}

export default AdminAccessModal;
