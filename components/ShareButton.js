"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ title }) {
  const [copied, setCopied] = useState(false);

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // clipboard blocked — nothing more we can do silently
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // AbortError means the person deliberately closed the share sheet —
        // respect that and do nothing further. Any other failure (e.g. the
        // API exists but there's nothing registered to share to, common on
        // desktop browsers) falls through to copying the link instead, so
        // the button never just silently does nothing.
        if (e.name === "AbortError") return;
      }
    }
    await copyLink(url);
  }

  return (
    <button className="ve-btn ve-btn-ghost" onClick={handleShare} type="button">
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
