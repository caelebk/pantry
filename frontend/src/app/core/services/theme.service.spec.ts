import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const stubSystemDark = (dark: boolean) =>
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: dark })),
    );
  const create = () => TestBed.inject(ThemeService);

  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark');
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
  });

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    vi.unstubAllGlobals();
  });

  it('starts from the OS colour scheme when nothing is stored', () => {
    stubSystemDark(false);
    expect(create().darkMode()).toBe(false);
    TestBed.resetTestingModule();
    stubSystemDark(true);
    expect(create().darkMode()).toBe(true);
  });

  it('prefers the stored choice over the OS colour scheme', () => {
    stubSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(create().darkMode()).toBe(false);
  });

  it('stores an explicit toggle so the next load starts in that theme', () => {
    stubSystemDark(true);
    const service = create();
    service.toggle();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('keeps the theme-color meta in step with the applied theme', () => {
    stubSystemDark(false);
    const service = create();
    const themeColor = () =>
      document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
    service.apply(true);
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    expect(themeColor()).toBe('#0f172a');
    service.toggle();
    expect(themeColor()).toBe('#f8fafc');
    service.toggle();
    expect(themeColor()).toBe('#0f172a');
  });

  it('keeps a local explicit choice when the server preference is system', () => {
    stubSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const service = create();
    service.syncFromUserPreference('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(service.darkMode()).toBe(false);
  });

  it('applies an explicit server preference only when nothing is stored locally', () => {
    stubSystemDark(false);
    const service = create();
    service.syncFromUserPreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(service.darkMode()).toBe(true);
    service.toggle();
    service.syncFromUserPreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(service.darkMode()).toBe(false);
  });

  it('lets the profile page replace or clear the stored choice', () => {
    stubSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const service = create();
    service.setUserPreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(service.darkMode()).toBe(true);
    service.setUserPreference('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    service.setUserPreference('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(service.darkMode()).toBe(true);
  });
});
