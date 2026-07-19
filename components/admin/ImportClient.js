"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, XCircle, SkipForward, FileJson } from "lucide-react";
import { importProduct } from "@/actions/import";

const PLACEHOLDER = `[
  {
    "name": "Rhino UN101SP Ultranite Safety Shoes",
    "sku": "UN101SP0BLK",
    "brand": "RHINO",
    "category": "PPE & Equipment",
    "price": 40.37,
    "shortDescription": "Direct Vulcanized Technology (DVT) for exceptional bonding between the shoe upper and the NBR sole.",
    "imageUrls": [
      "https://veshop.com.sg/2-medium_default/rhino-un101sp-ultranite-safety-shoes.jpg",
      "https://veshop.com.sg/3-medium_default/rhino-un101sp-ultranite-safety-shoes.jpg"
    ]
  }
]`;

export default function ImportClient() {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const router = useRouter();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(reader.result);
    reader.readAsText(file);
    e.target.value = "";
  }

  async function runImport() {
    let items;
    try {
      items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error("Expected a JSON array");
    } catch (e) {
      alert("That doesn't look like valid JSON: " + e.message);
      return;
    }
    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: items.length });

    const nextResults = [];
    for (const item of items) {
      try {
        const r = await importProduct(item);
        nextResults.push(r);
      } catch (e) {
        nextResults.push({ ok: false, name: item.name, error: e.message });
      }
      setResults([...nextResults]);
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setRunning(false);
    router.refresh();
  }

  return (
    <div>
      <div className="ve-admin-head"><h2>Bulk import products</h2></div>
      <p className="ve-muted" style={{ marginBottom: 14 }}>
        Paste a JSON list of products below (Claude will prepare these for you in chat). Each needs at least
        a name, price and imageUrls (a list — one or more photos). Photos are automatically watermarked with
        your logo if one's set in Site content. Products with a SKU that already exists are skipped
        automatically, so it's safe to re-run a batch.
      </p>
      <label className="ve-btn ve-btn-ghost ve-btn-sm" style={{ display: "inline-flex", marginBottom: 10, cursor: "pointer" }}>
        <FileJson size={15} /> Load from .json file
        <input type="file" accept=".json,application/json" hidden onChange={handleFile} disabled={running} />
      </label>
      <textarea
        className="ve-import-textarea"
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={running}
      />
      <div className="ve-form-actions" style={{ justifyContent: "flex-start", marginTop: 12 }}>
        <button className="ve-btn ve-btn-primary" onClick={runImport} disabled={running || !text.trim()}>
          <Upload size={15} /> {running ? `Importing ${progress.done}/${progress.total}...` : "Start import"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="ve-import-results">
          {results.map((r, i) => (
            <div key={i} className="ve-import-row">
              {r.ok && !r.skipped && <CheckCircle2 size={15} className="ve-import-ok" />}
              {r.ok && r.skipped && <SkipForward size={15} className="ve-import-skip" />}
              {!r.ok && <XCircle size={15} className="ve-import-fail" />}
              <span>{r.name}</span>
              {r.skipped && <em>already exists — skipped</em>}
              {!r.ok && <em>{r.error}</em>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
