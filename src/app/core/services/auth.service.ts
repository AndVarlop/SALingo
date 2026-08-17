import { Injectable, computed, inject, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  name: string;
}

/**
 * Real authentication backed by Supabase Auth. `session` is the single
 * source of truth and is kept in sync via `onAuthStateChange`, so every
 * signed-in/out event anywhere (this tab or a token refresh) propagates
 * automatically to `isAuthenticated` and every computed that depends on it.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly session = signal<Session | null>(null);
  /** True once the initial session check has resolved — guards wait on this. */
  readonly ready = signal(false);
  /** Resolves once, the first time the initial session check completes. Guards await this. */
  readonly readyPromise: Promise<void>;

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly userId = computed(() => this.session()?.user.id ?? null);
  readonly userEmail = computed(() => this.session()?.user.email ?? null);

  constructor() {
    this.readyPromise = this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      this.ready.set(true);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.ready.set(true);
    });
  }

  async login(credentials: Credentials): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword(credentials);
    if (error) throw new Error(error.message);
  }

  /**
   * Returns `{ requiresEmailConfirmation: true }` when the Supabase project
   * has "Confirm email" enabled — in that case no session is created yet and
   * the caller should tell the user to check their inbox instead of
   * redirecting straight into the app.
   */
  async register(payload: RegisterPayload): Promise<{ requiresEmailConfirmation: boolean }> {
    const { data, error } = await this.supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: { data: { name: payload.name } },
    });
    if (error) throw new Error(error.message);
    return { requiresEmailConfirmation: data.session === null };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login`,
    });
    if (error) throw new Error(error.message);
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}
