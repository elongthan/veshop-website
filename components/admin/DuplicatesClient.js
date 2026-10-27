"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { findDuplicateProducts, deleteProducts, scanUncleanText, fixUncleanText, scanPossiblyTruncated, scanRepeatedText, fixRepeatedText } from "@/actions/products";
import { fmtPrice } from "@/lib/slug";

export default function DuplicatesClient() {
  const [groups, setGroups] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [textIssues, setTextIssues] = useState(null);
  const [textScanning, setTextScanning] = useState(false);
  const [textFixing, setTextFixing] = useState(false);
  const [truncated, setTruncated] = useState(null);
  const [truncScanning, setTruncScanning] = useState(false);
  const [repeated, setRepeated] = useState(null);
  const [repScanning, setRepScanning] = useState(false);
  const [repFixing, setRepFixing] = useState(false);
  const [repMessage, setRepMessage] = useState("");
  const router = useRouter();

  async function scan() {
    setScanning(true);
    const result = await findDuplicateProducts();
    setGroups(result);
    setScanning(false);
  }

  async function deleteOne(id) {
    await deleteProducts([id]);
    setGroups((gs) => gs.map((g) => g.filter((p) => p.id !== id)).filter((g) => g.length > 1));
    router.refresh();
  }

  async function autoClean() {
    if (!groups?.length) return;
    if (!confirm(
      `For each of the ${groups.length} duplicate group(s), this keeps the oldest entry and deletes the rest. Continue?`
    )) return;
    setCleaning(true);
    const idsToDelete = groups.flatMap((g) => g.slice(1).map((p) => p.id));
    await deleteProducts(idsToDelete);
    setGroups([]);
    setCleaning(false);
    router.refresh();
  }

  async function scanText() {
    setTextScanning(true);
    const result = await scanUncleanText();
    setTextIssues(result);
    setTextScanning(false);
  }

  async function fixAllText() {
    if (!textIssues?.length) return;
    setTextFixing(true);
    await fixUncleanText(textIssues.map((p) => p.id));
    setTextIssues([]);
    setTextFixing(false);
    router.refresh();
  }

  async function scanTruncated() {
    setTruncScanning(true);
    const result = await scanPossiblyTruncated();
    setTruncated(result);
    setTruncScanning(false);
  }

  async function scanRepeated() {
    setRepScanning(true);
    setRepMessage("");
    try {
      setRepeated(await scanRepeatedText());
    } catch (err) {
      alert("Could not scan: " + err.message);
    }
    setRepScanning(false);
  }

  async function fixRepeated() {
    if (!repeated?.fixable.length) return;
    if (!confirm(`Remove the repeated text from ${repeated.fixable.length} product description(s)? Only descriptions are changed.`)) return;
    setRepFixing(true);
    try {
      const n = await fixRepeatedText(repeated.fixable.map((p) => p.id));
      setRepeated((r) => ({ ...r, fixable: [] }));
      setRepMessage(`Done — cleaned ${n} product description(s).`);
      router.refresh();
    } catch (err) {
      alert("Could not clean up: " + err.message);
    }
    setRepFixing(false);
  }

  const totalExtra = groups?.reduce((n, g) => n + (g.length - 1), 0) || 0;

  return (
    <div>
      <div className="ve-admin-head"><h2>Find duplicate products</h2></div>
      <p className="ve-muted" style={{ marginBottom: 14 }}>
        Groups products that share the same SKU, or (for products with no SKU) the same name and brand —
        useful after re-running an import batch. Nothing is deleted until you say so.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={scan} disabled={scanning}>
          <Search size={15} /> {scanning ? "Scanning..." : "Scan for duplicates"}
        </button>
        {groups?.length > 0 && (
          <button className="ve-btn ve-btn-ghost ve-btn-sm ve-btn-danger" onClick={autoClean} disabled={cleaning}>
            <Trash2 size={15} /> {cleaning ? "Cleaning..." : `Auto-clean all (remove ${totalExtra} extra)`}
          </button>
        )}
      </div>

      {groups && groups.length === 0 && (
        <div className="ve-empty" style={{ padding: "30px 0" }}>
          <CheckCircle2 size={28} strokeWidth={1.3} />
          <p>No duplicates found.</p>
        </div>
      )}

      {groups?.map((group, i) => (
        <div key={i} className="ve-dup-group">
          <div className="ve-dup-group-label">{group.length} copies of "{group[0].name}"</div>
          {group.map((p, idx) => (
            <div key={p.id} className="ve-admin-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 70px" }}>
              <span className="ve-admin-item">
                <img src={p.image_url || ""} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  <em>{p.sku || "no SKU"}</em>
                </span>
              </span>
              <span>{p.brand || "—"}</span>
              <span>{fmtPrice(p.price)}</span>
              <span>{idx === 0 ? <span className="ve-badge ve-badge-success">Keep (oldest)</span> : <span className="ve-muted">duplicate</span>}</span>
              <span className="ve-admin-actions">
                <button onClick={() => deleteOne(p.id)} aria-label="Delete"><Trash2 size={15} /></button>
              </span>
            </div>
          ))}
        </div>
      ))}

      <div className="ve-admin-head" style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        <h2>Special characters check</h2>
      </div>
      <p className="ve-muted" style={{ marginBottom: 14 }}>
        Finds products whose name, short description, or description contain characters (curly quotes,
        special dashes, etc.) that can break the PDF catalog's text — usually leftover from the old site.
        New saves and imports are cleaned automatically; this checks products saved before that.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={scanText} disabled={textScanning}>
          <Search size={15} /> {textScanning ? "Scanning..." : "Scan all products"}
        </button>
        {textIssues?.length > 0 && (
          <button className="ve-btn ve-btn-ghost ve-btn-sm" onClick={fixAllText} disabled={textFixing}>
            <Sparkles size={15} /> {textFixing ? "Cleaning..." : `Clean up all ${textIssues.length}`}
          </button>
        )}
      </div>

      {textIssues && textIssues.length === 0 && (
        <div className="ve-empty" style={{ padding: "30px 0" }}>
          <CheckCircle2 size={28} strokeWidth={1.3} />
          <p>No special-character issues found.</p>
        </div>
      )}

      {textIssues?.length > 0 && (
        <div className="ve-dup-group">
          {textIssues.map((p) => (
            <div key={p.id} className="ve-admin-row" style={{ gridTemplateColumns: "1fr" }}>
              <span className="ve-admin-item">
                <img src={p.image_url || ""} alt="" />
                <span><strong>{p.name}</strong></span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="ve-admin-head" style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        <h2>Repeated text in descriptions</h2>
      </div>
      <p className="ve-muted" style={{ marginBottom: 14 }}>
        Finds description bullets where the same words are written twice in a row (for example
        "LightweightLightweight"), or the same line appears twice. Cleaning keeps one copy and changes only
        the Description field. Lines where two <em>different</em> wordings are joined together are listed
        separately, because they need a person to choose the right one.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={scanRepeated} disabled={repScanning}>
          <Search size={15} /> {repScanning ? "Scanning..." : "Scan all products"}
        </button>
        {repeated?.fixable.length > 0 && (
          <button className="ve-btn ve-btn-ghost ve-btn-sm" onClick={fixRepeated} disabled={repFixing}>
            <Sparkles size={15} /> {repFixing ? "Cleaning..." : `Clean up all ${repeated.fixable.length}`}
          </button>
        )}
      </div>

      {repMessage && <p style={{ marginBottom: 14, fontWeight: 600 }}>{repMessage}</p>}

      {repeated && repeated.fixable.length === 0 && !repMessage && (
        <div className="ve-empty" style={{ padding: "30px 0" }}>
          <CheckCircle2 size={28} strokeWidth={1.3} />
          <p>No repeated text found.</p>
        </div>
      )}

      {repeated?.fixable.length > 0 && (
        <div className="ve-dup-group">
          <div className="ve-dup-group-label">{repeated.fixable.length} product(s) will be cleaned</div>
          {repeated.fixable.map((p) => (
            <div key={p.id} className="ve-admin-row" style={{ gridTemplateColumns: "1fr" }}>
              <span className="ve-admin-item">
                <img src={p.image_url || ""} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  {p.examples.map((ex, i) => (
                    <em key={i} style={{ display: "block" }}>"{ex.from}" → "{ex.to}"</em>
                  ))}
                  {p.count > p.examples.length && <em style={{ display: "block" }}>{p.count} fixes in total</em>}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {repeated?.check.length > 0 && (
        <div className="ve-dup-group" style={{ marginTop: 16 }}>
          <div className="ve-dup-group-label">
            {repeated.check.length} product(s) to check by hand — two wordings may be joined together
          </div>
          {repeated.check.map((p) => (
            <div key={p.id} className="ve-admin-row" style={{ gridTemplateColumns: "1fr" }}>
              <span className="ve-admin-item">
                <img src={p.image_url || ""} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  {p.lines.map((l, i) => (
                    <em key={i} style={{ display: "block" }}>"{l}"</em>
                  ))}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="ve-admin-head" style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        <h2>Possibly-truncated descriptions</h2>
      </div>
      <p className="ve-muted" style={{ marginBottom: 14 }}>
        Flags products whose short description doesn't end with normal punctuation — the signature of the
        old site's SQL export cutting text off partway through a sentence during migration. Compare each
        flagged one against the old site, then find it by name in the Products tab and re-paste the full
        text into its Short description field.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={scanTruncated} disabled={truncScanning}>
          <Search size={15} /> {truncScanning ? "Scanning..." : "Scan all products"}
        </button>
      </div>

      {truncated && truncated.length === 0 && (
        <div className="ve-empty" style={{ padding: "30px 0" }}>
          <CheckCircle2 size={28} strokeWidth={1.3} />
          <p>No obviously truncated descriptions found.</p>
        </div>
      )}

      {truncated?.length > 0 && (
        <div className="ve-dup-group">
          {truncated.map((p) => (
            <div key={p.id} className="ve-admin-row" style={{ gridTemplateColumns: "1fr" }}>
              <span className="ve-admin-item">
                <img src={p.image_url || ""} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  <em>...{p.snippet}</em>
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
