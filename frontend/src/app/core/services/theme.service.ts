import { Injectable, signal } from '@angular/core';

export type ThemePreference = 'dark' | 'light' | 'system';

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
  readonly darkMode = signal(true);

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
    return next;
  }

  /**
   * Resolves a persisted user preference ('dark' | 'light' | 'system')
   * and applies it. Falls back to the OS preference for 'system'.
   */
  syncFromUserPreference(preference: string): void {
    if (preference === 'dark') {
      this.apply(true);
      return;
    }
    if (preference === 'light') {
      this.apply(false);
      return;
    }
    const prefersDark =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(prefersDark);
  }
}
