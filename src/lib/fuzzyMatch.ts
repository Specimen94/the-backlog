/**
 * Lightweight fuzzy matching utilities for search.
 * Handles typos, case differences, and partial matches — like Google's "did you mean".
 */

/** Levenshtein distance between two strings */
export function levenshtein(a: string, b: string): number {
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use single-row DP for memory efficiency
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/** Normalized similarity 0..1 (1 = identical) */
export function similarity(a: string, b: string): number {
  const al = a.toLowerCase(), bl = b.toLowerCase();
  if (al === bl) return 1;
  const maxLen = Math.max(al.length, bl.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(al, bl) / maxLen;
}

/**
 * Check if a query word fuzzy-matches a target word.
 * Short words (<=3 chars) require exact match; longer words allow proportional typos.
 */
export function fuzzyWordMatch(query: string, target: string): boolean {
  const q = query.toLowerCase(), t = target.toLowerCase();
  if (t.includes(q)) return true;
  if (q.length <= 2) return t.includes(q);
  const maxDist = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
  return levenshtein(q, t) <= maxDist;
}

/**
 * Check if a query fuzzy-matches a title.
 * Splits both into words and checks if most query words match some title word.
 */
export function fuzzyTitleMatch(query: string, title: string): boolean {
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const tWords = title.toLowerCase().split(/[\s\-_:,.]+/).filter(Boolean);
  
  if (qWords.length === 0) return false;
  
  // Each query word must fuzzy-match at least one title word OR be a substring of title
  const titleLower = title.toLowerCase();
  let matched = 0;
  for (const qw of qWords) {
    if (titleLower.includes(qw) || tWords.some(tw => fuzzyWordMatch(qw, tw))) {
      matched++;
    }
  }
  
  // At least half the query words should match for it to be relevant
  return matched >= Math.ceil(qWords.length * 0.5);
}

/**
 * Score how well a query matches a title (lower = better, like golf).
 * Returns a number where more negative = better match.
 */
export function fuzzyScore(query: string, title: string): number {
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const tLower = title.toLowerCase();
  const tWords = tLower.split(/[\s\-_:,.]+/).filter(Boolean);
  
  let score = 0;
  let exactMatches = 0;
  let fuzzyMatches = 0;
  
  for (const qw of qWords) {
    if (tLower.includes(qw)) {
      exactMatches++;
      score -= 3;
    } else if (tWords.some(tw => fuzzyWordMatch(qw, tw))) {
      fuzzyMatches++;
      score -= 1; // fuzzy match is worth less than exact
    } else {
      score += 2; // penalty for unmatched word
    }
  }
  
  // Bonus for exact phrase match
  if (tLower.includes(query.toLowerCase())) score -= 5;
  // Bonus for title starting with query
  if (tLower.startsWith(query.toLowerCase())) score -= 3;
  
  return score;
}
