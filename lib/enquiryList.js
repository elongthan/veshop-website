// "Enquiry list": a visitor collects items while browsing, then sends one
// enquiry for all of them. Stored only in the visitor's own browser.
// Plain functions + a tiny subscribe/cache so React can read it safely.

const KEY = "ve_enquiry_v1";
export const MAX_ITEMS = 50;
export const MAX_QTY = 9999;
const EMPTY = Object.freeze([]);
const SITE = "https://www.veshop.com.sg";

let cache = EMPTY;
let loaded = false;
const listeners = new Set();

function clean(raw) {
  if (!Array.isArray(raw)) return EMPTY;
  const seen = new Set();
  const out = [];
  for (const it of raw) {
    const id = typeof it?.id === "string" ? it.id.slice(0, 64) : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(it.qty)) || 1));
    out.push({
      id,
      name: String(it.name || "").slice(0, 200),
      sku: String(it.sku || "").slice(0, 60),
      qty
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    cache = clean(JSON.parse(window.localStorage.getItem(KEY) || "[]"));
  } catch {
    cache = EMPTY;
  }
}

function commit(next) {
  cache = next.length ? next : EMPTY;
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
  listeners.forEach((l) => l());
}

export function getItems() { load(); return cache; }
export function getServerItems() { return EMPTY; }

export function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === KEY) {
      try { cache = clean(JSON.parse(e.newValue || "[]")); } catch { cache = EMPTY; }
      fn();
    }
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

// -> "added" | "exists" | "full"
export function addItem({ id, name, sku }) {
  load();
  if (cache.some((i) => i.id === id)) return "exists";
  if (cache.length >= MAX_ITEMS) return "full";
  commit([...cache, ...clean([{ id, name, sku, qty: 1 }])]);
  return "added";
}

export function removeItem(id) { load(); commit(cache.filter((i) => i.id !== id)); }

export function setQty(id, qty) {
  load();
  const q = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(qty)) || 1));
  commit(cache.map((i) => (i.id === id ? { ...i, qty: q } : i)));
}

export function clearItems() { load(); commit([]); }

const line = (i, n) => `${n}. ${i.name}${i.sku ? ` (SKU: ${i.sku})` : ""} — Qty: ${i.qty}\n   ${SITE}/product/${i.id}`;

export function buildEmailMessage(items) {
  if (!items.length) return "";
  return `Hi, I'd like a quote for the following items:\n\n${items.map((i, n) => line(i, n + 1)).join("\n")}\n\nThank you.\n`;
}

export function buildWhatsAppMessage(items) {
  if (!items.length) return "";
  return `Hi, I'd like a quote for these items:\n\n${items.map((i, n) => line(i, n + 1)).join("\n")}`;
}

export function buildWhatsAppUrl(number, items) {
  const digits = String(number || "").replace(/[^0-9]/g, "");
  if (!digits || !items.length) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildWhatsAppMessage(items))}`;
}
