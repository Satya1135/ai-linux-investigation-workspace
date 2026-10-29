import {
  AppSettings,
  InterfaceDensity,
  InterfaceTextSize,
  LandingPage,
  InitialIntakeMode,
} from '../types';

export const SETTINGS_STORAGE_KEY = 'ai-linux-investigator.settings.v1';

export const DEFAULT_SETTINGS: AppSettings = {
  density: 'standard',
  reducedMotion: false,
  textSize: 'standard',
  defaultLandingPage: 'dashboard',
  defaultIntakeMode: 'sample',
};

/**
 * Apply settings to the DOM document element.
 * Immediately modifies data attributes for live CSS theming and accessibility scaling.
 */
export function applySettingsToDOM(settings: AppSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-density', settings.density);
  root.setAttribute('data-reduced-motion', String(settings.reducedMotion));
  root.setAttribute('data-text-size', settings.textSize);
}

/**
 * Read settings from browser localStorage with safe validation and fallback defaults.
 */
export function readSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_SETTINGS };
    }

    const density: InterfaceDensity =
      parsed.density === 'compact' ? 'compact' : 'standard';

    const reducedMotion: boolean =
      typeof parsed.reducedMotion === 'boolean'
        ? parsed.reducedMotion
        : false;

    const textSize: InterfaceTextSize =
      parsed.textSize === 'large' ? 'large' : 'standard';

    const defaultLandingPage: LandingPage =
      parsed.defaultLandingPage === 'evidence' ? 'evidence' : 'dashboard';

    const defaultIntakeMode: InitialIntakeMode =
      parsed.defaultIntakeMode === 'upload' || parsed.defaultIntakeMode === 'paste'
        ? parsed.defaultIntakeMode
        : 'sample';

    return {
      density,
      reducedMotion,
      textSize,
      defaultLandingPage,
      defaultIntakeMode,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Write settings to browser localStorage and immediately apply to DOM.
 */
export function writeSettings(settings: AppSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    applySettingsToDOM(settings);
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

/**
 * Reset all preferences to default values without modifying saved case records.
 */
export function resetSettings(): AppSettings {
  const defaults = { ...DEFAULT_SETTINGS };
  writeSettings(defaults);
  return defaults;
}

