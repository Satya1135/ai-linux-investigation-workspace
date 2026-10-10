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
