export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          program_start_date: string | null;
          current_streak: number;
          longest_streak: number;
          total_sessions_completed: number;
          total_focus_minutes: number;
          has_onboarded: boolean;
          subscription_status: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          program_start_date?: string | null;
          current_streak?: number;
          longest_streak?: number;
          total_sessions_completed?: number;
          total_focus_minutes?: number;
          has_onboarded?: boolean;
          subscription_status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          program_start_date?: string | null;
          current_streak?: number;
          longest_streak?: number;
          total_sessions_completed?: number;
          total_focus_minutes?: number;
          has_onboarded?: boolean;
          subscription_status?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          duration_selected_minutes: number;
          duration_actual_seconds: number;
          completed: boolean;
          broken_at: string | null;
          session_mode: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          duration_selected_minutes: number;
          duration_actual_seconds?: number;
          completed?: boolean;
          broken_at?: string | null;
          session_mode: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          duration_selected_minutes?: number;
          duration_actual_seconds?: number;
          completed?: boolean;
          broken_at?: string | null;
          session_mode?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      daily_challenges: {
        Row: {
          id: string;
          day_number: number;
          phase: number;
          title: string;
          description: string;
          verification_type: string;
          points: number;
        };
        Insert: {
          id?: string;
          day_number: number;
          phase: number;
          title: string;
          description: string;
          verification_type: string;
          points?: number;
        };
        Update: {
          id?: string;
          day_number?: number;
          phase?: number;
          title?: string;
          description?: string;
          verification_type?: string;
          points?: number;
        };
        Relationships: [];
      };
      challenge_completions: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          completed_at: string;
          day_number: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          completed_at?: string;
          day_number: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          completed_at?: string;
          day_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'challenge_completions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_completions_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'daily_challenges';
            referencedColumns: ['id'];
          },
        ];
      };
      focus_tests: {
        Row: {
          id: string;
          user_id: string;
          taken_at: string;
          test_number: number;
          score_overall: number;
          score_stillness: number;
          score_blink_rate: number;
          score_completion: number;
          duration_seconds: number;
          passed: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          taken_at?: string;
          test_number: number;
          score_overall: number;
          score_stillness: number;
          score_blink_rate: number;
          score_completion: number;
          duration_seconds: number;
          passed?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          taken_at?: string;
          test_number?: number;
          score_overall?: number;
          score_stillness?: number;
          score_blink_rate?: number;
          score_completion?: number;
          duration_seconds?: number;
          passed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'focus_tests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
