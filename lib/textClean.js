// Product text sometimes arrives with "smart" typography characters — from
// the old site, or pasted from Word/websites (curly quotes, non-breaking
// hyphens, em-dashes, etc). The PDF catalog's built-in font can't measure or
// draw some of these correctly, which silently breaks line-wrapping and cuts
// text off mid-word. Rather than only fixing this at PDF-generation time, we
// clean text at the point it's saved (manual edits and bulk import) so bad
// characters never make it into the database in the first place.
export function cleanText(str) {
  if (!str) return str;
  return str
    .replace(/[\u2010-\u2015\u2212]/g, "-")       // hyphens/dashes incl. non-breaking hyphen
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")  // smart single quotes
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')  // smart double quotes
    .replace(/\u2026/g, "...")                     // ellipsis
    .replace(/[\u00A0\u202F]/g, " ")               // non-breaking / narrow spaces
    .replace(/[\u2022\u25CF\u25AA]/g, "-")         // bullet-like symbols
    .replace(/[^\x00-\xFF]/g, "");                 // anything else outside Latin-1
}

// True if the raw string contains a character cleanText would change —
// used to find existing products that were saved before this cleanup existed.
export function hasUncleanText(str) {
  if (!str) return false;
  return cleanText(str) !== str;
}

// ---------------------------------------------------------------------------
// Repeated text in product descriptions
//
// The old site's export often left a bullet's text written twice in a row, e.g.
// "LightweightLightweight" or "Breathable upperBreathable upper". Each line of a
// description is shown as one bullet, so we look line by line.
// ---------------------------------------------------------------------------

// "XX" or "X X" (the same text twice, nothing else on the line) -> "X".
// Each half must be at least 4 characters so short real words are never touched.
const DOUBLED_LINE = /^(.{4,}?)\s*\1$/i;

export function collapseDoubledLine(line) {
  const trimmed = (line || "").trim();
  const m = trimmed.match(DOUBLED_LINE);
  return m ? m[1].trim() : trimmed;
}

// A lowercase letter glued straight onto a capital ("Toe CapNano Carbon"): usually two
// different wordings joined together. These can't be fixed safely by a program.
const JOINED_WORDS = /[a-z][A-Z][a-z]/;

// Returns the cleaned description plus what changed, without saving anything.
export function analyzeDescription(text) {
  const result = { text: text || "", changes: [], removedDuplicateLines: 0, check: [] };
  if (!text) return result;

  const seen = new Set();
  const out = [];
  for (const raw of String(text).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const fixed = collapseDoubledLine(line);
    if (fixed !== line) result.changes.push({ from: line, to: fixed });
    const key = fixed.toLowerCase();
    if (seen.has(key)) { result.removedDuplicateLines++; continue; }
    seen.add(key);
    out.push(fixed);
    if (JOINED_WORDS.test(fixed)) result.check.push(fixed);
  }
  result.text = out.join("\n");
  return result;
}

export function descriptionNeedsFix(text) {
  const a = analyzeDescription(text);
  return a.changes.length > 0 || a.removedDuplicateLines > 0;
}
