// Bulk editing of product prices / status from a spreadsheet.
//
// Everything here is a plain function (no database, no browser) so it can be
// tested on its own. The flow:
//   1. productsToSheetRows(products)           -> rows to export as CSV
//   2. planSheetUpdates(rowsFromCsv, products)  -> what would change + problems
//   3. validateBulkUpdates(updates)             -> re-checked again on the server

export const SHEET_HEADERS = [
  "ID",
  "SKU (reference only)",
  "Name (reference only)",
  "Brand (reference only)",
  "Categories (reference only)",
  "Price (SGD incl. GST)",
  "Sale price (SGD, blank = no sale)",
  "Active (Yes/No)",
  "Out of stock (Yes/No)"
];

const MAX_PRICE = 10000000;
const BIG_CHANGE_UP = 1.5;   // flag price rises of more than +50%
const BIG_CHANGE_DOWN = 0.5; // flag price drops of more than -50%

const money = (n) => Number(n).toFixed(2);

export function productsToSheetRows(products) {
  const rows = products.map((p) => [
    p.id,
    p.sku || "",
    p.name || "",
    p.brand || "",
    (p.categories || []).join("; "),
    p.price == null ? "" : money(p.price),
    p.sale_price == null ? "" : money(p.sale_price),
    p.active === false ? "No" : "Yes",
    p.out_of_stock ? "Yes" : "No"
  ]);
  return [SHEET_HEADERS, ...rows];
}

function norm(h) {
  return String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumns(header) {
  const cols = { id: -1, price: -1, sale: -1, active: -1, oos: -1 };
  header.forEach((h, i) => {
    const n = norm(h);
    if (n === "id" || n === "productid") { if (cols.id === -1) cols.id = i; }
    else if (n.includes("sale")) { if (cols.sale === -1) cols.sale = i; }
    else if (n.startsWith("price")) { if (cols.price === -1) cols.price = i; }
    else if (n.includes("active")) { if (cols.active === -1) cols.active = i; }
    else if (n.includes("outofstock")) { if (cols.oos === -1) cols.oos = i; }
  });
  return cols;
}

// -> { blank: true } | { value } | { error }
export function parseMoney(raw) {
  let s = String(raw ?? "").replace(/ /g, " ").trim();
  if (s === "") return { blank: true };
  s = s.replace(/s?\$|sgd/gi, "").replace(/\s+/g, "");
  if (s === "") return { error: "not a number" };

  if (s.includes(",")) {
    // "12,50" could mean twelve-fifty (European decimal comma) — guessing
    // wrong would silently make prices 100x too big, so refuse instead.
    if (!s.includes(".") && /,\d{1,2}$/.test(s)) {
      return { error: `"${raw}" is ambiguous — use a dot for decimals (12.50)` };
    }
    s = s.replace(/,/g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return { error: `"${raw}" is not a valid amount` };

  const value = Math.round(Number(s) * 100) / 100;
  if (value > MAX_PRICE) return { error: `"${raw}" is unreasonably large` };
  return { value };
}

// -> { blank: true } | { value: boolean } | { error }
export function parseYesNo(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "") return { blank: true };
  if (["yes", "y", "true", "1"].includes(s)) return { value: true };
  if (["no", "n", "false", "0"].includes(s)) return { value: false };
  return { error: `"${raw}" should be Yes or No` };
}

const same = (a, b) => (a == null && b == null) || (a != null && b != null && Math.abs(a - b) < 0.005);

export function planSheetUpdates(rows, products) {
  if (!rows.length) return { error: "The file looks empty." };

  const cols = findColumns(rows[0]);
  if (cols.id === -1) {
    return { error: "Couldn't find the ID column. Please use a spreadsheet downloaded from this page and keep the first column (ID) as it is." };
  }
  if (cols.price === -1 && cols.sale === -1 && cols.active === -1 && cols.oos === -1) {
    return { error: "Couldn't find any columns to update (Price, Sale price, Active, Out of stock). Please use a spreadsheet downloaded from this page." };
  }

  const byId = new Map(products.map((p) => [String(p.id), p]));
  const seen = new Set();
  const changes = [];
  const problems = [];
  let unchanged = 0;
  let rowsRead = 0;

  const add = (level, row, name, message) => problems.push({ level, row, name, message });

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const line = r + 1; // matches the row number shown in Excel (header = row 1)
    const id = String(row[cols.id] ?? "").trim();

    if (!id) { add("warning", line, "", "Row has no ID — skipped"); continue; }
    rowsRead++;

    const product = byId.get(id);
    if (!product) { add("error", line, "", "Product not found (it may have been deleted, or the ID was edited) — skipped"); continue; }
    if (seen.has(id)) { add("warning", line, product.name, "Duplicate row for this product — ignored (only the first row for each product is used)"); continue; }
    seen.add(id);

    const fields = {};
    const flags = [];
    let rowFailed = false;
    const fail = (msg) => { add("error", line, product.name, `${msg} — row skipped`); rowFailed = true; };

    const currentPrice = product.price == null ? null : Number(product.price);
    const currentSale = product.sale_price == null ? null : Number(product.sale_price);
    let effectivePrice = currentPrice;
    let effectiveSale = currentSale;

    if (cols.price !== -1) {
      const m = parseMoney(row[cols.price]);
      if (m.error) fail(`Price: ${m.error}`);
      else if (m.blank) add("warning", line, product.name, "Price is blank — price left unchanged");
      else {
        effectivePrice = m.value;
        if (!same(m.value, currentPrice)) fields.price = { from: currentPrice, to: m.value };
      }
    }

    if (cols.sale !== -1) {
      const m = parseMoney(row[cols.sale]);
      if (m.error) fail(`Sale price: ${m.error}`);
      else {
        effectiveSale = m.blank ? null : m.value;
        if (!same(effectiveSale, currentSale)) fields.sale_price = { from: currentSale, to: effectiveSale };
      }
    }

    if (cols.active !== -1) {
      const m = parseYesNo(row[cols.active]);
      if (m.error) fail(`Active: ${m.error}`);
      else if (!m.blank) {
        const current = product.active !== false;
        if (m.value !== current) fields.active = { from: current, to: m.value };
      }
    }

    if (cols.oos !== -1) {
      const m = parseYesNo(row[cols.oos]);
      if (m.error) fail(`Out of stock: ${m.error}`);
      else if (!m.blank) {
        const current = !!product.out_of_stock;
        if (m.value !== current) fields.out_of_stock = { from: current, to: m.value };
      }
    }

    if (rowFailed) continue;

    if (fields.price) {
      const { from, to } = fields.price;
      if (to === 0) flags.push("zero");
      else if (from > 0 && (to / from > BIG_CHANGE_UP || to / from < BIG_CHANGE_DOWN)) flags.push("big");
    }
    if (effectiveSale != null && effectivePrice != null && effectiveSale >= effectivePrice && fields.sale_price) {
      add("warning", line, product.name, "Sale price is not lower than the price, so it won't show as a sale");
    }

    if (Object.keys(fields).length) changes.push({ id, name: product.name, sku: product.sku || "", fields, flags });
    else unchanged++;
  }

  return { changes, unchanged, problems, rowsRead };
}

// Turns planned changes into the compact objects sent to the server.
export function changesToUpdates(changes) {
  return changes.map((c) => {
    const u = { id: c.id };
    for (const [key, v] of Object.entries(c.fields)) u[key] = v.to;
    return u;
  });
}

const isMoney = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_PRICE;
const round2 = (v) => Math.round(v * 100) / 100;

// Server-side re-check: never trust what the browser sends.
export function validateBulkUpdates(updates) {
  const valid = [];
  const errors = [];
  if (!Array.isArray(updates)) return { valid, errors: [{ id: null, error: "Invalid request" }] };

  for (const u of updates) {
    const id = typeof u?.id === "string" ? u.id.trim() : "";
    if (!id || id.length > 64) { errors.push({ id: id || null, error: "Missing product ID" }); continue; }

    const fields = {};
    let bad = null;

    if ("price" in u) {
      if (isMoney(u.price)) fields.price = round2(u.price); else bad = "Invalid price";
    }
    if ("sale_price" in u) {
      if (u.sale_price === null) fields.sale_price = null;
      else if (isMoney(u.sale_price)) fields.sale_price = round2(u.sale_price);
      else bad = "Invalid sale price";
    }
    if ("active" in u) {
      if (typeof u.active === "boolean") fields.active = u.active; else bad = "Invalid active value";
    }
    if ("out_of_stock" in u) {
      if (typeof u.out_of_stock === "boolean") fields.out_of_stock = u.out_of_stock; else bad = "Invalid stock value";
    }

    if (bad) { errors.push({ id, error: bad }); continue; }
    if (!Object.keys(fields).length) { errors.push({ id, error: "Nothing to change" }); continue; }
    valid.push({ id, fields });
  }
  return { valid, errors };
}
