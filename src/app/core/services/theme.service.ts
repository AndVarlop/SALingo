import { Injectable, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/storage-keys.constant';
import { ThemeMode } from '../models';
import { UserStateService } from './user-state.service';

const THEME_KEY = `${STORAGE_KEYS.settings}.theme`;

/**
 * Local-first theme state: applies instantly from localStorage (or system
 * preference) with no network round trip, then reconciles with the user's
 * saved preference once `UserStateService` loads it from Supabase. Every
 * change is pushed back to Supabase so the preference follows the user
 * across devices.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly userState = inject(UserStateService);

  readonly theme = signal<ThemeMode>(this.loadInitialTheme());

  constructor() {
    effect(() => {
      const mode = this.theme();
      document.documentElement.setAttribute('data-theme', mode);
      this.storage.set(THEME_KEY, mode);
    });

    // Adopt the theme stored in Supabase once it arrives (e.g. after login
    // on a new device). Converges immediately if it already matches.
    effect(() => {
      const remoteTheme = this.userState.settings().theme;
      if (remoteTheme !== this.theme()) this.theme.set(remoteTheme);
    });
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.theme.set(mode);
    this.userState.updateSettings({ theme: mode });
  }

  private loadInitialTheme(): ThemeMode {
    const saved = this.storage.get<ThemeMode>(THEME_KEY);
    if (saved) return saved;
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
