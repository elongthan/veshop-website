"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserCog } from "lucide-react";
import { createAdmin, removeAdmin } from "@/actions/adminUsers";

export default function UsersClient({ admins }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createAdmin({ username, email, password });
      setUsername(""); setEmail(""); setPassword("");
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function handleRemove(userId, name) {
    if (!confirm(`Remove admin access for "${name}"?`)) return;
    try {
      await removeAdmin(userId);
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="ve-admin-head"><h2>Admin users</h2></div>

      <div className="ve-admin-table" style={{ marginBottom: 24 }}>
        <div className="ve-admin-row ve-admin-row-head" style={{ gridTemplateColumns: "1fr 1fr 70px" }}>
          <span>Username</span><span>Added</span><span></span>
        </div>
        {admins.map((a) => (
          <div className="ve-admin-row" key={a.user_id} style={{ gridTemplateColumns: "1fr 1fr 70px" }}>
            <span><UserCog size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{a.username}</span>
            <span>{new Date(a.created_at).toLocaleDateString("en-SG")}</span>
            <span className="ve-admin-actions">
              <button onClick={() => handleRemove(a.user_id, a.username)} aria-label="Remove"><Trash2 size={15} /></button>
            </span>
          </div>
        ))}
        {admins.length === 0 && <div className="ve-empty" style={{ padding: "24px 0" }}>No admin usernames set yet.</div>}
      </div>

      <form className="ve-settings" onSubmit={handleAdd}>
        <h3>Add a new admin</h3>
        <label className="ve-filter-label">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. warehouse-staff" required />
        <label className="ve-filter-label">Email (for account recovery — not shown publicly)</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="ve-filter-label">Temporary password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="ve-form-error">{error}</div>}
        <div className="ve-form-actions">
          <button className="ve-btn ve-btn-primary" type="submit" disabled={saving}>
            <Plus size={15} /> {saving ? "Adding..." : "Add admin"}
          </button>
        </div>
      </form>
    </div>
  );
}
