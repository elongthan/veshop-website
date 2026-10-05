import { buildZip } from "./zipStore.js";
import { buildManifestCsv } from "./backupList.js";

// Downloads every image in `items` and hands back finished zip files one
// "part" at a time. A single broken image never stops the run — it's marked
// FAILED in that part's manifest and the rest carries on.
//
// Kept free of any React/browser-only code so it can be tested directly.
export const DEFAULT_PART_SIZE = 200;

export async function runImageBackup({
  items,
  filePrefix = "veshop-images",
  partSize = DEFAULT_PART_SIZE,
  concurrency = 6,
  fetchImpl = (...args) => fetch(...args),
  onProgress,
  onPart,
  shouldStop
}) {
  const encoder = new TextEncoder();
  const parts = [];
  for (let i = 0; i < items.length; i += partSize) parts.push(items.slice(i, i + partSize));

  let done = 0;
  let saved = 0;
  let failed = 0;
  let partsFinished = 0;

  for (let p = 0; p < parts.length; p++) {
    if (shouldStop?.()) break;

    const rows = parts[p];
    const results = new Array(rows.length);
    let next = 0;

    async function worker() {
      while (!shouldStop?.()) {
        const i = next++;
        if (i >= rows.length) return;
        const item = rows[i];
        try {
          const res = await fetchImpl(item.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = new Uint8Array(await res.arrayBuffer());
          results[i] = { item, data, status: "ok" };
          saved++;
        } catch (e) {
          results[i] = { item, data: null, status: `FAILED (${e?.message || "network error"})` };
          failed++;
        }
        done++;
        onProgress?.({ part: p + 1, parts: parts.length, done, total: items.length, failed });
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));

    // Stopped part-way through this part: drop the incomplete part rather
    // than hand over a zip that's quietly missing images.
    if (shouldStop?.()) break;

    const files = results.filter((r) => r.data).map((r) => ({ name: r.item.path, data: r.data }));
    files.push({
      name: `manifest-part-${p + 1}.csv`,
      data: encoder.encode(buildManifestCsv(results))
    });

    await onPart?.({
      blob: buildZip(files),
      filename: `${filePrefix}-part-${p + 1}-of-${parts.length}.zip`,
      part: p + 1,
      parts: parts.length
    });
    partsFinished++;
  }

  return { total: items.length, saved, failed, parts: parts.length, partsFinished, stopped: !!shouldStop?.() };
}
