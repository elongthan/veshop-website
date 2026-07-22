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
