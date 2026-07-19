"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolveUsernameToEmail } from "@/actions/adminUsers";

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");

    let email = identifier.trim();
    if (!email.includes("@")) {
      const resolved = await resolveUsernameToEmail(email);
      if (!resolved) {
        setErr("Incorrect username/email or password.");
        setLoading(false);
        return;
      }
      email = resolved;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr("Incorrect username/email or password.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <main className="ve-admin-login">
      <Link className="ve-link ve-back" href="/"><ArrowLeft size={14} /> Back to site</Link>
      <form onSubmit={submit} className="ve-login-card">
        <Lock size={22} strokeWidth={1.4} />
        <h2>Admin sign in</h2>
        <p className="ve-muted">Manage products, pricing visibility and catalog structure.</p>
        <input
          type="text" placeholder="Username or email" value={identifier}
          onChange={(e) => setIdentifier(e.target.value)} autoFocus required
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required
        />
        {err && <div className="ve-form-error">{err}</div>}
        <button className="ve-btn ve-btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
