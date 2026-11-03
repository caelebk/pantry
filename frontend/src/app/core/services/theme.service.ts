import { Injectable, signal } from '@angular/core';

export type ThemePreference = 'dark' | 'light' | 'system';

/** localStorage key shared with the pre-boot script in `index.html`. */
export const THEME_STORAGE_KEY = 'pantry.theme';

/** Stored explicit choice if there is one, otherwise the OS colour scheme. */
function readStoredTheme(): 'dark' | 'light' | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Storage can be blocked; treat as no stored choice.
  }
  return null;
}

function resolveInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = readStoredTheme();
  if (stored) return stored === 'dark';
  return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function persistTheme(value: 'dark' | 'light' | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(THEME_STORAGE_KEY, value);
    else window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be blocked; the theme still applies for this session.
  }
}

/**
 * Single source of truth for application theming.
 *
 * All dark-mode toggling must go through this service so that the `.dark`
 * class on `<html>` stays consistent across the app shell and standalone
 * surfaces (auth pages). Do not manipulate `documentElement.classList`
 * directly elsewhere.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Reactive current mode. `true` = dark, `false` = light. */
  readonly darkMode = signal(resolveInitialDarkMode());

  /** Re-syncs the signal from whatever class state is already applied. */
  initializeFromDocument(): void {
    if (typeof document !== 'undefined') {
      this.darkMode.set(document.documentElement.classList.contains('dark'));
    }
  }

  /** Applies an explicit mode to the document root. */
  apply(isDark: boolean): void {
    this.darkMode.set(isDark);
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
  }

  /** Flips the current mode. Returns the resulting mode. */
  toggle(): boolean {
    const next = !this.darkMode();
    this.apply(next);
    persistTheme(next ? 'dark' : 'light');
    return next;
  }

  /**
   * Applies the account preference loaded from the server. A local explicit choice
   * (stored by the toggle) wins, and a server 'system' never overrides it.
   * Only 'light' or 'dark' is applied, and only when nothing is stored locally.
   */
  syncFromUserPreference(preference: string): void {
    if (preference !== 'dark' && preference !== 'light') return;
    if (readStoredTheme()) return;
    persistTheme(preference);
    this.apply(preference === 'dark');
  }

  /**
   * Applies a preference the user just chose on the profile page.
   * Explicit choices replace the stored value; 'system' clears it and follows the OS.
   */
  setUserPreference(preference: string): void {
    if (preference === 'dark' || preference === 'light') {
      persistTheme(preference);
      this.apply(preference === 'dark');
      return;
    }
    persistTheme(null);
    const prefersDark =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(prefersDark);
  }
}
