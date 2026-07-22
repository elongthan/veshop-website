export function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function fmtPrice(n) {
  return `SGD ${Number(n).toFixed(2)}`;
}
