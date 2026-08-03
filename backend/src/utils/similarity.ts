/**
 * String similarity utility for domain matching in Pantry backend
 */

export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  // Exact word boundary containment check
  const isSubstring = s1.includes(s2) || s2.includes(s1);

  // Token Jaccard similarity
  const tokens1 = new Set(s1.split(/\s+/).filter(Boolean));
  const tokens2 = new Set(s2.split(/\s+/).filter(Boolean));

  let intersectionCount = 0;
  tokens1.forEach((token) => {
    if (tokens2.has(token)) {
      intersectionCount++;
    }
  });

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  const tokenJaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

  // Dice coefficient on character bigrams
  const bigramScore = calculateBigramSimilarity(s1, s2);

  // Weighted score combination
  let totalScore = 0.5 * tokenJaccard + 0.5 * bigramScore;

  if (isSubstring) {
    totalScore = Math.max(totalScore, 0.75 + tokenJaccard * 0.25);
  }

  // Ensure bounded between 0 and 1
  const finalScore = Math.min(1.0, Math.max(0.0, totalScore));
  return Math.round(finalScore * 100) / 100;
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateBigramSimilarity(s1: string, s2: string): number {
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1.0 : 0.0;

  const getBigrams = (str: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      map.set(bigram, (map.get(bigram) || 0) + 1);
    }
    return map;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);

  let intersection = 0;
  let total1 = 0;
  bg1.forEach((count) => (total1 += count));
  let total2 = 0;
  bg2.forEach((count) => (total2 += count));

  bg1.forEach((count, bigram) => {
    if (bg2.has(bigram)) {
      intersection += Math.min(count, bg2.get(bigram)!);
    }
  });

  return (2.0 * intersection) / (total1 + total2);
}
