import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from './supabase.types';

/**
 * Thin wrapper around the Supabase client. Every other service reaches the
 * backend through `client`, so swapping auth/storage providers later only
 * touches this one file.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient<Database> = createClient<Database>(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );
}
