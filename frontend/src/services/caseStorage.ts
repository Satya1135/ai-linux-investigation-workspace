import { SavedInvestigationCase } from '../types';

const STORAGE_KEY = 'ai-linux-investigator.saved-cases.v1';

export function readSavedCases(): SavedInvestigationCase[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedInvestigationCase =>
      Boolean(item && typeof item === 'object' && 'caseId' in item && 'originalAnalysis' in item && 'reviews' in item)
    );
  } catch {
    return [];
  }
}

export function writeSavedCases(cases: SavedInvestigationCase[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {
    throw new Error('The browser could not save this case. Check available storage and try again.');
  }
}

export function makeCaseId(): string {
  const date = new Date();
  const stamp = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LIN-${stamp}-${suffix}`;
}

/**
 * Type-guard validating whether an unknown object conforms to SavedInvestigationCase.
 */
export function isValidCase(item: unknown): item is SavedInvestigationCase {
  if (!item || typeof item !== 'object') return false;
  const c = item as Record<string, unknown>;
  return (
    typeof c.caseId === 'string' &&
    c.caseId.trim().length > 0 &&
    typeof c.caseName === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.updatedAt === 'string' &&
    typeof c.verdict === 'string' &&
    typeof c.totalEventsAnalyzed === 'number' &&
    typeof c.originalAnalysis === 'object' &&
    c.originalAnalysis !== null &&
    Array.isArray(c.reviews)
  );
}

/**
 * Remove all saved cases from browser localStorage.
 */
export function clearAllSavedCasesFromStorage(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear cases from localStorage:', error);
  }
}

/**
 * Export saved cases array as a timestamped JSON file download.
 */
export function exportCasesToJson(cases: SavedInvestigationCase[]): void {
  const payload = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    totalCases: cases.length,
    cases,
  };
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  anchor.href = url;
  anchor.download = `linux-investigation-cases-backup-${timestamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
