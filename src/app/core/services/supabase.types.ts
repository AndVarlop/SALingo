/**
 * Hand-written mirror of supabase/schema.sql. Keep in sync manually, or
 * regenerate with `supabase gen types typescript` once the Supabase CLI is
 * wired into this project.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_emoji: string;
          primary_language: string;
          level: string;
          started_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          theme: string;
          daily_goal_minutes: number;
          notifications_enabled: boolean;
          sound_enabled: boolean;
          difficulty: string;
          learning_language: string;
        };
        Insert: Partial<Database['public']['Tables']['user_settings']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['user_settings']['Row']>;
        Relationships: [];
      };
      user_streak: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
        };
        Insert: Partial<Database['public']['Tables']['user_streak']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['user_streak']['Row']>;
        Relationships: [];
      };
      language_progress: {
        Row: {
          user_id: string;
          language: string;
          level: string;
          xp: number;
          words_learned: number;
          total_study_minutes: number;
          average_accuracy: number;
          skills: unknown;
          level_progress: unknown;
        };
        Insert: Partial<Database['public']['Tables']['language_progress']['Row']> & {
          user_id: string;
          language: string;
        };
        Update: Partial<Database['public']['Tables']['language_progress']['Row']>;
        Relationships: [];
      };
      lesson_completions: {
        Row: { user_id: string; lesson_id: string; completed_at: string };
        Insert: { user_id: string; lesson_id: string; completed_at?: string };
        Update: Partial<Database['public']['Tables']['lesson_completions']['Row']>;
        Relationships: [];
      };
      daily_activity: {
        Row: {
          user_id: string;
          activity_date: string;
          minutes_studied: number;
          xp_earned: number;
          goal_met: boolean;
        };
        Insert: Partial<Database['public']['Tables']['daily_activity']['Row']> & {
          user_id: string;
          activity_date: string;
        };
        Update: Partial<Database['public']['Tables']['daily_activity']['Row']>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          occurred_at: string;
          type: string;
          title: string;
          xp_earned: number;
          accuracy: number | null;
        };
        Insert: Partial<Database['public']['Tables']['activity_log']['Row']> & {
          user_id: string;
          type: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['activity_log']['Row']>;
        Relationships: [];
      };
      review_items: {
        Row: {
          user_id: string;
          word_id: string;
          times_studied: number;
          times_correct: number;
          times_incorrect: number;
          last_reviewed_at: string | null;
          next_review_at: string;
          difficulty: number;
          interval_days: number;
        };
        Insert: Partial<Database['public']['Tables']['review_items']['Row']> & {
          user_id: string;
          word_id: string;
        };
        Update: Partial<Database['public']['Tables']['review_items']['Row']>;
        Relationships: [];
      };
      user_achievements: {
        Row: { user_id: string; achievement_id: string; unlocked_at: string };
        Insert: { user_id: string; achievement_id: string; unlocked_at?: string };
        Update: Partial<Database['public']['Tables']['user_achievements']['Row']>;
        Relationships: [];
      };
      vocabulary_words: {
        Row: {
          id: string;
          language: string;
          term: string;
          translation: string;
          pronunciation: string;
          example: string;
          category: string;
          level: string;
        };
        Insert: Database['public']['Tables']['vocabulary_words']['Row'];
        Update: Partial<Database['public']['Tables']['vocabulary_words']['Row']>;
        Relationships: [];
      };
      user_word_favorites: {
        Row: { user_id: string; word_id: string; created_at: string };
        Insert: { user_id: string; word_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['user_word_favorites']['Row']>;
        Relationships: [];
      };
      grammar_progress: {
        Row: { user_id: string; topic_id: string; completed: boolean; best_score: number; attempts: number };
        Insert: Partial<Database['public']['Tables']['grammar_progress']['Row']> & {
          user_id: string;
          topic_id: string;
        };
        Update: Partial<Database['public']['Tables']['grammar_progress']['Row']>;
        Relationships: [];
      };
      roleplay_sessions: {
        Row: { id: string; user_id: string; scenario_id: string; score: number; completed_at: string };
        Insert: Partial<Database['public']['Tables']['roleplay_sessions']['Row']> & {
          user_id: string;
          scenario_id: string;
        };
        Update: Partial<Database['public']['Tables']['roleplay_sessions']['Row']>;
        Relationships: [];
      };
      scenario_sessions: {
        Row: { id: string; user_id: string; accuracy: number; completed_at: string };
        Insert: Partial<Database['public']['Tables']['scenario_sessions']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['scenario_sessions']['Row']>;
        Relationships: [];
      };
      user_mistakes: {
        Row: {
          id: string;
          user_id: string;
          wrong_text: string;
          correct_text: string;
          category: string;
          source: string;
          first_seen_at: string;
          last_seen_at: string;
          occurrences: number;
        };
        Insert: Partial<Database['public']['Tables']['user_mistakes']['Row']> & {
          user_id: string;
          wrong_text: string;
          correct_text: string;
          category: string;
          source: string;
        };
        Update: Partial<Database['public']['Tables']['user_mistakes']['Row']>;
        Relationships: [];
      };
      company_prep_analyses: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          position: string | null;
          job_description: string;
          result: unknown;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['company_prep_analyses']['Row']> & {
          user_id: string;
          job_description: string;
          result: unknown;
        };
        Update: Partial<Database['public']['Tables']['company_prep_analyses']['Row']>;
        Relationships: [];
      };
      interview_tips_checklist: {
        Row: { user_id: string; checked_indices: unknown; updated_at: string };
        Insert: Partial<Database['public']['Tables']['interview_tips_checklist']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['interview_tips_checklist']['Row']>;
        Relationships: [];
      };
      job_outcomes: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          position: string | null;
          outcome: string;
          notes: string | null;
          event_date: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['job_outcomes']['Row']> & {
          user_id: string;
          outcome: string;
        };
        Update: Partial<Database['public']['Tables']['job_outcomes']['Row']>;
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          target_position: string | null;
          started_at: string;
          duration_seconds: number;
          question_count: number;
          overall_score: number;
          strengths: unknown;
          improvements: unknown;
          mode: string;
        };
        Insert: Partial<Database['public']['Tables']['interview_sessions']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['interview_sessions']['Row']>;
        Relationships: [];
      };
      interview_profile: {
        Row: {
          user_id: string;
          target_position: string | null;
          has_experience: boolean | null;
          english_level: string | null;
          struggle_area: string | null;
          interview_date: string | null;
          onboarded: boolean;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['interview_profile']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['interview_profile']['Row']>;
        Relationships: [];
      };
      interview_answers: {
        Row: {
          user_id: string;
          question_id: string;
          answer_text: string;
          source: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['interview_answers']['Row']> & {
          user_id: string;
          question_id: string;
        };
        Update: Partial<Database['public']['Tables']['interview_answers']['Row']>;
        Relationships: [];
      };
      interview_vocab_progress: {
        Row: { user_id: string; word_id: string; known: boolean; updated_at: string };
        Insert: Partial<Database['public']['Tables']['interview_vocab_progress']['Row']> & {
          user_id: string;
          word_id: string;
        };
        Update: Partial<Database['public']['Tables']['interview_vocab_progress']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
