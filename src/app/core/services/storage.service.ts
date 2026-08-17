import { Injectable } from '@angular/core';

/**
 * Single point of access to browser localStorage.
 * Nothing else in the app should call `localStorage` directly.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isAvailable = typeof window !== 'undefined' && !!window.localStorage;

  get<T>(key: string): T | null {
    if (!this.isAvailable) return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isAvailable) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (!this.isAvailable) return;
    localStorage.removeItem(key);
  }

  clearAll(keys: string[]): void {
    keys.forEach((key) => this.remove(key));
  }
}
