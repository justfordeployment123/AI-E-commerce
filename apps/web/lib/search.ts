// Smart, order-independent, typo-tolerant product search.
//
// The catalog here is small (order of ~100-a few hundred active products),
// so this runs entirely client-side against a snapshot fetched once —
// instant results, no per-keystroke network round trip, and no dependence
// on Postgres ILIKE matching a single literal substring (which fails the
// moment a query's words are reordered, e.g. "pro iphone 15" not matching
// "iPhone 15 Pro").
//
// Matching is per-token (each word in the query scored independently against
// the product), then combined so that:
//   - products matching MORE of the query's words rank higher
//   - a query word that matches nothing doesn't zero out the whole result —
//     it just fails to contribute, so "iphone 15 pro ultra" still surfaces
//     "iPhone 15 Pro Max" even though no product has "ultra" in it
//   - close-but-not-exact words (typos) still count, via Levenshtein distance
//   - a word that's common across the whole catalog (e.g. "pro", appearing
//     in AirPods Pro, iPhone Pro, iPad Pro...) counts for less than a rare,
//     distinctive word (e.g. "macbook") — otherwise "macbook pro" would
//     happily surface AirPods Pro on the strength of "pro" alone, which is
//     exactly the kind of false positive this is meant to avoid

export interface SearchableItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number | null;
  image: string | null;
  stock?: number;
  rating?: number;
  reviewCount?: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Classic O(n*m) edit distance — fine at this scale (short words, ~100 items).
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row.push(Math.min(
        row[j - 1] + 1,        // insertion
        prevRow[j] + 1,        // deletion
        prevRow[j - 1] + cost, // substitution
      ));
    }
    prevRow = row;
  }
  return prevRow[b.length];
}

// Generic tier/qualifier words (same concept the scraper's CeX matcher
// already uses as TIER_WORDS in apps/api/.../scraper.service.ts) — these are
// modifiers, not product identities. Matching one alone shouldn't carry much
// weight: statistical document-frequency alone isn't reliable for this,
// since a word like "pro" can happen to be rare in a small or unevenly
// stocked catalog snapshot and get mistaken for a *distinctive* term instead
// of a generic one — which is exactly how "macbook pro" ended up ranking
// "AirPods Pro" above nothing at all.
const GENERIC_MODIFIERS = new Set([
  'pro', 'plus', 'max', 'mini', 'lite', 'ultra', 'air', 'fe', 'slim', 'new',
]);

// How many typo'd characters to tolerate, scaled to word length — short
// words need to match almost exactly (else "pro" would fuzzy-match "pin"),
// longer words can absorb a couple of mistakes.
function typoTolerance(len: number): number {
  if (len <= 4) return 1;
  if (len <= 7) return 2;
  return 3;
}

/** Score a single query token against one product. Higher = better match. */
function scoreToken(token: string, corpusText: string, corpusWords: string[]): number {
  if (corpusWords.includes(token)) return 4;                         // exact whole word
  if (corpusWords.some(w => w.startsWith(token))) return 3;           // prefix of a word
  if (corpusText.includes(token)) return 2;                           // substring anywhere

  // Fuzzy/typo tolerance — numbers are excluded (searching "15" should never
  // loosely match "16" or "150"; only alphabetic words get this leniency).
  if (token.length >= 3 && /[a-z]/.test(token)) {
    const tolerance = typoTolerance(token.length);
    const isClose = corpusWords.some(w => Math.abs(w.length - token.length) <= tolerance
      && levenshtein(token, w) <= tolerance);
    if (isClose) return 1.5;
  }

  return 0;
}

/** How many distinct products contain this token — used to down-weight
 *  words that are common across the catalog (low relevance signal) versus
 *  rare/distinctive ones (high relevance signal). */
function documentFrequency(token: string, corpora: string[][]): number {
  let count = 0;
  for (const words of corpora) {
    if (words.includes(token)) count++;
  }
  return count;
}

function scoreItem(
  queryTokens: string[],
  tokenWeights: number[],
  query: string,
  item: SearchableItem,
): number {
  const corpusText = `${item.brand} ${item.name}`.toLowerCase();
  const corpusWords = tokenize(corpusText);

  let total = 0;
  let matchedCount = 0;
  for (let i = 0; i < queryTokens.length; i++) {
    const s = scoreToken(queryTokens[i], corpusText, corpusWords);
    if (s > 0) {
      total += s * tokenWeights[i];
      matchedCount++;
    }
  }

  if (matchedCount === 0) return 0;

  // Quadratic coverage penalty: matching every word keeps full credit, but
  // matching only half the words (e.g. one real word + one that doesn't
  // appear anywhere) is worth a quarter, not half — partial overlap on a
  // multi-word query should rank far below a genuinely fuller match, not
  // just a little below it.
  const coverage = matchedCount / queryTokens.length;
  let score = total * (coverage * coverage);

  // Exact-phrase bonus: typed the whole thing verbatim as a substring — this
  // keeps today's "literal search string" behavior ranking at the very top.
  if (query.length >= 2 && corpusText.includes(query)) score += 5;

  return score;
}

export function searchProducts(items: SearchableItem[], query: string, limit = 6): SearchableItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = tokenize(q);
  if (tokens.length === 0) return [];

  const corpora = items.map(item => tokenize(`${item.brand} ${item.name}`));
  const n = items.length;
  // Smoothed IDF: common words (high document frequency) get a weight close
  // to a floor of ~0.3; rare/distinctive words approach ~2.5+. Generic
  // tier/qualifier words get an additional fixed dampening on top, since
  // their genericness is semantic, not something document frequency in the
  // current catalog snapshot can reliably detect (see GENERIC_MODIFIERS).
  const tokenWeights = tokens.map(t => {
    const df = documentFrequency(t, corpora);
    const idf = Math.log((n + 1) / (df + 1)) + 0.3;
    return GENERIC_MODIFIERS.has(t) ? idf * 0.35 : idf;
  });

  const MIN_SCORE = 1.5;

  return items
    .map(item => ({ item, score: scoreItem(tokens, tokenWeights, q, item) }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-break: in-stock first, then cheaper first — a reasonable default
      // ordering when relevance is equal.
      const aStock = (a.item.stock ?? 0) > 0 ? 1 : 0;
      const bStock = (b.item.stock ?? 0) > 0 ? 1 : 0;
      if (bStock !== aStock) return bStock - aStock;
      return (a.item.price ?? Infinity) - (b.item.price ?? Infinity);
    })
    .slice(0, limit)
    .map(({ item }) => item);
}
