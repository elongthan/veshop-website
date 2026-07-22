"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMyUsername, changeMyPassword } from "@/actions/adminUsers";

export default function AccountClient({ currentUsername }) {
  const [username, setUsername] = useState(currentUsername);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const router = useRouter();

  async function saveUsername(e) {
    e.preventDefault();
    setSavingUsername(true);
    setUsernameMsg("");
    try {
      await setMyUsername(username);
      setUsernameMsg("Saved — you can now sign in with this username.");
      router.refresh();
    } catch (err) {
      setUsernameMsg(err.message);
    }
    setSavingUsername(false);
  }

  async function savePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    setPasswordMsg("");
    try {
      await changeMyPassword(newPassword);
      setPasswordMsg("Password updated.");
      setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setPasswordMsg(err.message);
    }
    setSavingPassword(false);
  }

  return (
    <div>
      <div className="ve-admin-head"><h2>My account</h2></div>

      <form className="ve-settings" onSubmit={saveUsername} style={{ marginBottom: 20 }}>
        <h3>Username</h3>
        <p className="ve-hint" style={{ marginBottom: 10 }}>
          Set a username so you can sign in without typing your email each time.
        </p>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. veshopadmin" />
        {usernameMsg && <p className="ve-hint" style={{ marginTop: 8 }}>{usernameMsg}</p>}
        <div className="ve-form-actions">
          <button className="ve-btn ve-btn-primary" type="submit" disabled={savingUsername}>
            {savingUsername ? "Saving..." : "Save username"}
          </button>
        </div>
      </form>

      <form className="ve-settings" onSubmit={savePassword}>
        <h3>Change password</h3>
        <label className="ve-filter-label">New password (min. 8 characters)</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <label className="ve-filter-label">Confirm new password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {passwordMsg && <p className="ve-hint" style={{ marginTop: 8 }}>{passwordMsg}</p>}
        <div className="ve-form-actions">
          <button className="ve-btn ve-btn-primary" type="submit" disabled={savingPassword}>
            {savingPassword ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}
