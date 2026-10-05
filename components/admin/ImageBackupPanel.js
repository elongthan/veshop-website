"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadCloud, Square } from "lucide-react";
import { listBackupImages } from "@/actions/backup";
import { runImageBackup, DEFAULT_PART_SIZE } from "@/lib/imageBackup";

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ImageBackupPanel() {
  const [status, setStatus] = useState("idle"); // idle | listing | running | done | error
  const [progress, setProgress] = useState({ part: 0, parts: 0, done: 0, total: 0, failed: 0 });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const stopRef = useRef(false);

  // Warn before leaving mid-download — a half-finished backup is easy to lose track of.
  useEffect(() => {
    if (status !== "running") return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  async function start() {
    stopRef.current = false;
    setError("");
    setSummary(null);
    setStatus("listing");

    try {
      const items = await listBackupImages();
      if (items.length === 0) {
        setStatus("done");
        setSummary({ empty: true });
        return;
      }

      setProgress({ part: 1, parts: Math.ceil(items.length / DEFAULT_PART_SIZE), done: 0, total: items.length, failed: 0 });
      setStatus("running");

      const result = await runImageBackup({
        items,
        filePrefix: `veshop-images-${new Date().toISOString().slice(0, 10)}`,
        onProgress: setProgress,
        onPart: async ({ blob, filename }) => {
          saveBlob(blob, filename);
          await sleep(1200); // spacing so the browser doesn't drop back-to-back downloads
        },
        shouldStop: () => stopRef.current
      });

      setSummary(result);
      setStatus("done");
    } catch (err) {
      setError(err?.message || "Something went wrong while preparing the backup.");
      setStatus("error");
    }
  }

  const busy = status === "listing" || status === "running";
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
      <h2>Backup photos</h2>
      <p className="ve-muted" style={{ marginBottom: 12 }}>
        Your database (products, prices, descriptions) is backed up daily by Supabase, but the photo files are
        not part of that. This downloads a copy of every product photo, brand logo, category icon and banner to
        your computer as zip files.
      </p>
      <ul className="ve-muted" style={{ margin: "0 0 14px", paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
        <li>Your browser may ask to allow multiple downloads — choose Allow.</li>
        <li>Keep this page open until it finishes. Files land in your Downloads folder.</li>
        <li>Each zip also contains a manifest.csv showing which product every photo belongs to.</li>
      </ul>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="ve-btn ve-btn-primary" onClick={start} disabled={busy}>
          <DownloadCloud size={16} /> {busy ? "Working..." : "Download all photos"}
        </button>
        {status === "running" && (
          <button className="ve-btn ve-btn-ghost" onClick={() => { stopRef.current = true; }}>
            <Square size={14} /> Stop
          </button>
        )}
      </div>

      {status === "listing" && <p className="ve-muted" style={{ marginTop: 12 }}>Finding all photos...</p>}

      {status === "running" && (
        <div style={{ marginTop: 14, maxWidth: 460 }}>
          <div className="ve-progress"><span style={{ width: `${percent}%` }} /></div>
          <p className="ve-muted" style={{ marginTop: 6, fontSize: 13 }}>
            {progress.done} of {progress.total} photos ({percent}%) · zip part {progress.part} of {progress.parts}
            {progress.failed > 0 ? ` · ${progress.failed} couldn't be downloaded` : ""}
          </p>
        </div>
      )}

      {status === "done" && summary?.empty && (
        <p className="ve-muted" style={{ marginTop: 12 }}>No photos found to back up.</p>
      )}

      {status === "done" && summary && !summary.empty && (
        <div style={{ marginTop: 14 }}>
          {summary.stopped ? (
            <span className="ve-badge ve-badge-warning">
              Stopped — {summary.partsFinished} of {summary.parts} zip files were saved
            </span>
          ) : (
            <span className="ve-badge ve-badge-success">
              Done — {summary.saved} photos saved in {summary.partsFinished} zip file{summary.partsFinished === 1 ? "" : "s"}
            </span>
          )}
          {summary.failed > 0 && !summary.stopped && (
            <p className="ve-muted" style={{ marginTop: 8, fontSize: 13 }}>
              {summary.failed} photo{summary.failed === 1 ? "" : "s"} couldn't be downloaded (usually a broken image
              link). They're marked FAILED in the manifest.csv inside the zip that contains them.
            </p>
          )}
        </div>
      )}

      {status === "error" && <div className="ve-form-error" style={{ marginTop: 12 }}>{error}</div>}
    </div>
  );
}
