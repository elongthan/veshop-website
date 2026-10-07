"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Upload, AlertTriangle } from "lucide-react";
import { bulkUpdateProducts } from "@/actions/products";
import { toCsv, parseCsv } from "@/lib/csv";
import { productsToSheetRows, planSheetUpdates, changesToUpdates } from "@/lib/bulkEdit";

const BATCH = 50;
const PREVIEW_LIMIT = 300;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const price = (n) => (n == null ? "none" : Number(n).toFixed(2));
const yesNo = (b) => (b ? "Yes" : "No");

function downloadCsv(products, suffix) {
  const csv = toCsv(productsToSheetRows(products));
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `veshop-products-${new Date().toISOString().slice(0, 10)}${suffix}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function Change({ change, format }) {
  if (!change) return <span className="ve-muted">—</span>;
  return (
    <span>
      <span className="ve-muted">{format(change.from)}</span> → <strong>{format(change.to)}</strong>
    </span>
  );
}

export default function BulkEditPanel({ products, shown, onClose }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [fileKey, setFileKey] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [plan, setPlan] = useState(null);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);

  const filtersActive = shown.length !== products.length;

  function reset() {
    setPlan(null);
    setFileName("");
    setFileError("");
    setResult(null);
    setFileKey((k) => k + 1);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    setPlan(null);
    setResult(null);
    setFileError("");
    if (!file) return;
    setFileName(file.name);

    if (/\.xlsx?$/i.test(file.name)) {
      setFileError("That's an Excel file. In Excel choose File → Save As → \"CSV UTF-8 (Comma delimited)\", then upload the .csv file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("That file is too large to be a product spreadsheet (over 5MB).");
      return;
    }

    try {
      const text = await file.text();
      const planned = planSheetUpdates(parseCsv(text), products);
      if (planned.error) setFileError(planned.error);
      else setPlan(planned);
    } catch {
      setFileError("Couldn't read that file. Please upload a .csv file saved from Excel or Google Sheets.");
    }
  }

  async function apply() {
    if (!plan?.changes.length) return;
    const flagged = plan.changes.filter((c) => c.flags.length).length;
    const message =
      `Apply ${plan.changes.length} change${plan.changes.length === 1 ? "" : "s"} to your live website? Prices update straight away.` +
      (flagged ? `\n\n${flagged} of them are flagged as unusually large price changes or $0 prices — please make sure those are intended.` : "");
    if (!confirm(message)) return;

    const updates = changesToUpdates(plan.changes);
    setApplying(true);
    setProgress({ done: 0, total: updates.length });

    let updated = 0;
    const failed = [];
    let notAttempted = 0;

    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      try {
        const res = await bulkUpdateProducts(batch);
        updated += res.updated;
        failed.push(...res.failed);
      } catch (err) {
        // Whole request failed (network drop, signed out...). Stop rather than keep hammering.
        failed.push(...batch.map((u) => ({ id: u.id, error: err?.message || "Request failed" })));
        notAttempted = updates.length - i - batch.length;
        setProgress({ done: updates.length, total: updates.length });
        break;
      }
      setProgress({ done: Math.min(i + BATCH, updates.length), total: updates.length });
    }

    const nameOf = new Map(plan.changes.map((c) => [c.id, c.name]));
    setResult({
      updated,
      notAttempted,
      failed: failed.map((f) => ({ ...f, name: nameOf.get(f.id) || f.id }))
    });
    setPlan(null);
    setFileName("");
    setFileKey((k) => k + 1);
    setApplying(false);
    router.refresh();
  }

  const errors = plan ? plan.problems.filter((p) => p.level === "error") : [];
  const warnings = plan ? plan.problems.filter((p) => p.level === "warning") : [];
  const showCol = (key) => plan?.changes.some((c) => c.fields[key]);

  return (
    <div>
      <div className="ve-admin-head">
        <h2>Update from spreadsheet</h2>
        <button className="ve-btn ve-btn-ghost ve-btn-sm" onClick={onClose} disabled={applying}>
          <ArrowLeft size={15} /> Back to products
        </button>
      </div>

      <p className="ve-muted" style={{ marginBottom: 18, maxWidth: 720 }}>
        Change prices, sale prices, active status or stock for many products at once using Excel or Google Sheets.
        You'll see every change before anything is applied.
      </p>

      <div className="ve-settings" style={{ marginBottom: 18 }}>
        <h3>1. Download your products</h3>
        <p className="ve-muted" style={{ marginBottom: 10 }}>
          {filtersActive
            ? "You've filtered the product list, so you can download just those products — or everything."
            : "Downloads every product, including inactive ones."}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filtersActive && (
            <button className="ve-btn ve-btn-primary ve-btn-sm" onClick={() => downloadCsv(shown, "-filtered")}>
              <Download size={15} /> Download the {shown.length} shown
            </button>
          )}
          <button
            className={`ve-btn ve-btn-sm ${filtersActive ? "ve-btn-ghost" : "ve-btn-primary"}`}
            onClick={() => downloadCsv(products, "")}
          >
            <Download size={15} /> Download all {products.length}
          </button>
        </div>
      </div>

      <div className="ve-settings" style={{ marginBottom: 18 }}>
        <h3>2. Edit it in Excel or Google Sheets</h3>
        <ul className="ve-muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 13.5 }}>
          <li>Only change the <strong>Price</strong>, <strong>Sale price</strong>, <strong>Active</strong> and <strong>Out of stock</strong> columns.</li>
          <li>Leave the <strong>ID</strong> column alone — it's how each row is matched to its product. Columns marked "reference only" are ignored.</li>
          <li>A blank Sale price means "not on sale". Active and Out of stock take Yes or No.</li>
          <li>Save as <strong>CSV</strong> (Excel: File → Save As → "CSV UTF-8").</li>
        </ul>
      </div>

      <div className="ve-settings" style={{ marginBottom: 18 }}>
        <h3>3. Upload it to preview</h3>
        <p className="ve-muted" style={{ marginBottom: 10 }}>Nothing changes on your website until you press Apply.</p>
        <input key={fileKey} ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} hidden />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="ve-btn ve-btn-ghost" onClick={() => fileRef.current?.click()} disabled={applying}>
            <Upload size={15} /> Choose CSV file
          </button>
          {fileName && <span className="ve-muted">{fileName}</span>}
        </div>
        {fileError && <div className="ve-form-error" style={{ marginTop: 12 }}>{fileError}</div>}
      </div>

      {plan && (
        <div className="ve-settings" style={{ marginBottom: 18 }}>
          <h3>Preview</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 14px" }}>
            <span className="ve-badge ve-badge-success">{plan.changes.length} to update</span>
            <span className="ve-badge" style={{ background: "var(--paper)", color: "var(--muted)" }}>{plan.unchanged} unchanged</span>
            {errors.length > 0 && <span className="ve-badge ve-badge-warning">{errors.length} row{errors.length === 1 ? "" : "s"} skipped</span>}
            {warnings.length > 0 && <span className="ve-badge ve-badge-warning">{warnings.length} warning{warnings.length === 1 ? "" : "s"}</span>}
          </div>

          {plan.problems.length > 0 && (
            <details open={errors.length > 0} style={{ marginBottom: 14 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 13.5 }}>
                <AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Things to check ({plan.problems.length})
              </summary>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
                {[...errors, ...warnings].slice(0, 100).map((p, i) => (
                  <li key={i} style={{ color: p.level === "error" ? "#A3231E" : "var(--steel)" }}>
                    Row {p.row}{p.name ? ` (${p.name})` : ""}: {p.message}
                  </li>
                ))}
              </ul>
              {plan.problems.length > 100 && <p className="ve-muted" style={{ marginTop: 6 }}>…and {plan.problems.length - 100} more.</p>}
            </details>
          )}

          {plan.changes.length === 0 ? (
            <p className="ve-muted">No changes found — the spreadsheet matches what's on your site{errors.length ? ", apart from the skipped rows above" : ""}.</p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="ve-sheet-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      {showCol("price") && <th>Price</th>}
                      {showCol("sale_price") && <th>Sale price</th>}
                      {showCol("active") && <th>Active</th>}
                      {showCol("out_of_stock") && <th>Out of stock</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.changes.slice(0, PREVIEW_LIMIT).map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                          {c.sku && <div className="ve-muted" style={{ fontSize: 11.5 }}>{c.sku}</div>}
                          {c.flags.includes("big") && <span className="ve-badge ve-badge-warning">big price change — check</span>}
                          {c.flags.includes("zero") && <span className="ve-badge ve-badge-warning">price set to 0</span>}
                        </td>
                        {showCol("price") && <td><Change change={c.fields.price} format={price} /></td>}
                        {showCol("sale_price") && <td><Change change={c.fields.sale_price} format={price} /></td>}
                        {showCol("active") && <td><Change change={c.fields.active} format={yesNo} /></td>}
                        {showCol("out_of_stock") && <td><Change change={c.fields.out_of_stock} format={yesNo} /></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {plan.changes.length > PREVIEW_LIMIT && (
                <p className="ve-muted" style={{ marginTop: 8 }}>
                  Showing the first {PREVIEW_LIMIT} of {plan.changes.length} changes — all {plan.changes.length} will be applied.
                </p>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
                <button className="ve-btn ve-btn-primary" onClick={apply} disabled={applying}>
                  {applying
                    ? `Applying… ${progress.done} of ${progress.total}`
                    : `Apply ${plan.changes.length} change${plan.changes.length === 1 ? "" : "s"}`}
                </button>
                <button className="ve-btn ve-btn-ghost" onClick={reset} disabled={applying}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      {result && (
        <div className="ve-settings" style={{ marginBottom: 18 }}>
          <h3>Result</h3>
          <div style={{ margin: "8px 0" }}>
            <span className={`ve-badge ${result.failed.length ? "ve-badge-warning" : "ve-badge-success"}`}>
              {result.updated} product{result.updated === 1 ? "" : "s"} updated
              {result.failed.length ? `, ${result.failed.length} failed` : ""}
            </span>
          </div>
          {result.notAttempted > 0 && (
            <p style={{ color: "#A3231E", fontSize: 13.5 }}>
              The connection stopped part-way, so {result.notAttempted} further change{result.notAttempted === 1 ? " was" : "s were"} not
              attempted. Upload the same file again — products already updated will simply show as unchanged.
            </p>
          )}
          {result.failed.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
              {result.failed.slice(0, 50).map((f, i) => <li key={i}>{f.name}: {f.error}</li>)}
            </ul>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="ve-btn ve-btn-primary" onClick={onClose}>Back to products</button>
            <button className="ve-btn ve-btn-ghost" onClick={reset}>Upload another file</button>
          </div>
        </div>
      )}
    </div>
  );
}
