/**
 * ATScore India - Resume Version Matching
 * Detects when an uploaded resume is a newer version of an existing one.
 */
import { Resume } from '../types';

/**
 * Calculate the similarity score between two resume names.
 * Uses common versioning patterns to detect related documents.
 */
function nameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().replace(/\.(pdf|docx)$/, '');
  const n2 = name2.toLowerCase().replace(/\.(pdf|docx)$/, '');

  // Exact match after removing version suffixes
  const withoutVersion = (s: string) =>
    s.replace(/[_-]?(v\d+|version\d+|final|draft|new|updated|copy)\b/gi, '').trim();

  const base1 = withoutVersion(n1);
  const base2 = withoutVersion(n2);

  if (base1 === base2) return 1.0;
  if (base1.includes(base2) || base2.includes(base1)) return 0.85;

  // Check for common name components
  const tokens1 = base1.split(/[_\s\-]+/).filter(t => t.length > 2);
  const tokens2 = base2.split(/[_\s\-]+/).filter(t => t.length > 2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const common = tokens1.filter(t => tokens2.includes(t));
  return common.length / Math.max(tokens1.length, tokens2.length);
}

/**
 * Find existing resumes that appear to be versions of the uploaded resume.
 * Returns matching resumes sorted by similarity score (highest first).
 */
export function findVersionMatches(uploaded: Resume, existing: Resume[]): Resume[] {
  const threshold = 0.7;
  const results = existing
    .map(r => ({ resume: r, score: nameSimilarity(uploaded.name, r.name) }))
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(r => r.resume);

  return results.slice(0, 5); // max 5 matches
}
