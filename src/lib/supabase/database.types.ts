export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      account_signups: {
        Row: {
          created_at: string;
          first_name: string;
          kind: string;
          last_name: string;
          phone: string | null;
          terms_accepted_at: string;
          terms_version: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          first_name: string;
          kind: string;
          last_name: string;
          phone?: string | null;
          terms_accepted_at?: string;
          terms_version: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          first_name?: string;
          kind?: string;
          last_name?: string;
          phone?: string | null;
          terms_accepted_at?: string;
          terms_version?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      athlete_consents: {
        Row: {
          action: string;
          athlete_id: string;
          coach_proof: string | null;
          id: string;
          organization_id: string;
          purpose: string;
          recorded_at: string;
          recorded_by: string | null;
          source: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          athlete_id: string;
          coach_proof?: string | null;
          id?: string;
          organization_id: string;
          purpose?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          source: string;
        };
        Update: {
          action?: string;
          athlete_id?: string;
          coach_proof?: string | null;
          id?: string;
          organization_id?: string;
          purpose?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_consents_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      athlete_goals: {
        Row: {
          athlete_id: string;
          competition_location: string | null;
          competition_name: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          goal_type: string;
          hyrox_category: string | null;
          id: string;
          organization_id: string;
          priority: string;
          status: string;
          target_date: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id: string;
          competition_location?: string | null;
          competition_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          goal_type: string;
          hyrox_category?: string | null;
          id?: string;
          organization_id: string;
          priority?: string;
          status?: string;
          target_date?: string | null;
          updated_at?: string;
        };
        Update: {
          athlete_id?: string;
          competition_location?: string | null;
          competition_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          goal_type?: string;
          hyrox_category?: string | null;
          id?: string;
          organization_id?: string;
          priority?: string;
          status?: string;
          target_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_goals_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      athlete_invites: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          adult_confirmed_at: string | null;
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          organization_id: string;
          revoked_at: string | null;
          status: string;
          token_hash: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          adult_confirmed_at?: string | null;
          athlete_id: string;
          created_at?: string;
          created_by?: string | null;
          expires_at: string;
          id?: string;
          organization_id: string;
          revoked_at?: string | null;
          status?: string;
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          adult_confirmed_at?: string | null;
          athlete_id?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          organization_id?: string;
          revoked_at?: string | null;
          status?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_invites_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "athlete_invites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      athlete_invoices: {
        Row: {
          amount_cents: number;
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          due_on: string;
          id: string;
          issued_on: string;
          label: string;
          organization_id: string;
          paid_on: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          athlete_id: string;
          created_at?: string;
          created_by?: string | null;
          due_on: string;
          id?: string;
          issued_on: string;
          label: string;
          organization_id: string;
          paid_on?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          athlete_id?: string;
          created_at?: string;
          created_by?: string | null;
          due_on?: string;
          id?: string;
          issued_on?: string;
          label?: string;
          organization_id?: string;
          paid_on?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_invoices_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      athlete_messages: {
        Row: {
          athlete_id: string;
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          organization_id: string;
          read_at: string | null;
          sender: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id: string;
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id: string;
          read_at?: string | null;
          sender: string;
        };
        Update: {
          athlete_id?: string;
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id?: string;
          read_at?: string | null;
          sender?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_messages_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      athlete_notes: {
        Row: {
          athlete_id: string;
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          organization_id: string;
          updated_at: string;
          updated_by: string | null;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id: string;
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id: string;
          updated_at?: string;
          updated_by?: string | null;
          visibility: string;
        };
        Update: {
          athlete_id?: string;
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_notes_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      athlete_payments: {
        Row: {
          amount_cents: number;
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          label: string | null;
          method: string;
          organization_id: string;
          received_on: string;
          updated_at: string;
          vat_rate: number;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          athlete_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          method: string;
          organization_id: string;
          received_on: string;
          updated_at?: string;
          vat_rate?: number;
        };
        Update: {
          amount_cents?: number;
          athlete_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          label?: string | null;
          method?: string;
          organization_id?: string;
          received_on?: string;
          updated_at?: string;
          vat_rate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_payments_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      athlete_personal_records: {
        Row: {
          achieved_on: string;
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          event: string;
          hyrox_category: string | null;
          id: string;
          organization_id: string;
          race_name: string | null;
          time_seconds: number;
        };
        ComputedFields: never;
        Insert: {
          achieved_on: string;
          athlete_id: string;
          created_at?: string;
          created_by?: string | null;
          event: string;
          hyrox_category?: string | null;
          id?: string;
          organization_id: string;
          race_name?: string | null;
          time_seconds: number;
        };
        Update: {
          achieved_on?: string;
          athlete_id?: string;
          created_at?: string;
          created_by?: string | null;
          event?: string;
          hyrox_category?: string | null;
          id?: string;
          organization_id?: string;
          race_name?: string | null;
          time_seconds?: number;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_personal_records_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      athlete_profiles: {
        Row: {
          athlete_user_id: string | null;
          available_days: string[];
          created_at: string;
          created_by: string | null;
          display_name: string | null;
          email: string | null;
          equipment: string | null;
          experience: string | null;
          first_name: string;
          health_consent_at: string | null;
          health_constraints: string | null;
          id: string;
          last_name: string | null;
          level: string | null;
          max_session_minutes: number | null;
          organization_id: string;
          phone: string | null;
          photo_path: string | null;
          preferred_contact: string | null;
          schedule_constraints: string | null;
          sessions_per_week: number | null;
          sex: string | null;
          status: string;
          training_places: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_user_id?: string | null;
          available_days?: string[];
          created_at?: string;
          created_by?: string | null;
          display_name?: never;
          email?: string | null;
          equipment?: string | null;
          experience?: string | null;
          first_name: string;
          health_consent_at?: string | null;
          health_constraints?: string | null;
          id?: string;
          last_name?: string | null;
          level?: string | null;
          max_session_minutes?: number | null;
          organization_id: string;
          phone?: string | null;
          photo_path?: string | null;
          preferred_contact?: string | null;
          schedule_constraints?: string | null;
          sessions_per_week?: number | null;
          sex?: string | null;
          status?: string;
          training_places?: string[];
          updated_at?: string;
        };
        Update: {
          athlete_user_id?: string | null;
          available_days?: string[];
          created_at?: string;
          created_by?: string | null;
          display_name?: never;
          email?: string | null;
          equipment?: string | null;
          experience?: string | null;
          first_name?: string;
          health_consent_at?: string | null;
          health_constraints?: string | null;
          id?: string;
          last_name?: string | null;
          level?: string | null;
          max_session_minutes?: number | null;
          organization_id?: string;
          phone?: string | null;
          photo_path?: string | null;
          preferred_contact?: string | null;
          schedule_constraints?: string | null;
          sessions_per_week?: number | null;
          sex?: string | null;
          status?: string;
          training_places?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      athlete_reference_metrics: {
        Row: {
          athlete_id: string;
          bpm: number | null;
          coach_note: string | null;
          created_at: string;
          created_by: string | null;
          exercise_label: string | null;
          id: string;
          kind: string;
          load_kg: number | null;
          measured_on: string;
          organization_id: string;
          pace_max_sec_per_km: number | null;
          pace_min_sec_per_km: number | null;
          reps: number | null;
          source: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id: string;
          bpm?: number | null;
          coach_note?: string | null;
          created_at?: string;
          created_by?: string | null;
          exercise_label?: string | null;
          id?: string;
          kind: string;
          load_kg?: number | null;
          measured_on: string;
          organization_id: string;
          pace_max_sec_per_km?: number | null;
          pace_min_sec_per_km?: number | null;
          reps?: number | null;
          source: string;
        };
        Update: {
          athlete_id?: string;
          bpm?: number | null;
          coach_note?: string | null;
          created_at?: string;
          created_by?: string | null;
          exercise_label?: string | null;
          id?: string;
          kind?: string;
          load_kg?: number | null;
          measured_on?: string;
          organization_id?: string;
          pace_max_sec_per_km?: number | null;
          pace_min_sec_per_km?: number | null;
          reps?: number | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_reference_metrics_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      coach_profiles: {
        Row: {
          company_name: string | null;
          created_at: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          photo_path: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          company_name?: string | null;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          photo_path?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_name?: string | null;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          photo_path?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      coach_session_athletes: {
        Row: {
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          organization_id: string;
          session_id: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id: string;
          created_at?: string;
          created_by?: string | null;
          organization_id: string;
          session_id: string;
        };
        Update: {
          athlete_id?: string;
          created_at?: string;
          created_by?: string | null;
          organization_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_session_athletes_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "coach_session_athletes_session_id_organization_id_fkey";
            columns: ["session_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "coach_sessions";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      coach_session_exceptions: {
        Row: {
          created_at: string;
          created_by: string | null;
          new_date: string;
          new_start_time: string;
          organization_id: string;
          original_date: string;
          session_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          new_date: string;
          new_start_time: string;
          organization_id: string;
          original_date: string;
          session_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          new_date?: string;
          new_start_time?: string;
          organization_id?: string;
          original_date?: string;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_session_exceptions_session_id_organization_id_fkey";
            columns: ["session_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "coach_sessions";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      coach_sessions: {
        Row: {
          athlete_id: string | null;
          created_at: string;
          created_by: string | null;
          discipline: string | null;
          duration_minutes: number;
          ends_on: string | null;
          id: string;
          kind: string;
          location: string | null;
          notes: string | null;
          organization_id: string;
          repeats_weekly: boolean;
          start_time: string;
          starts_on: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          discipline?: string | null;
          duration_minutes: number;
          ends_on?: string | null;
          id?: string;
          kind: string;
          location?: string | null;
          notes?: string | null;
          organization_id: string;
          repeats_weekly?: boolean;
          start_time: string;
          starts_on: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          discipline?: string | null;
          duration_minutes?: number;
          ends_on?: string | null;
          id?: string;
          kind?: string;
          location?: string | null;
          notes?: string | null;
          organization_id?: string;
          repeats_weekly?: boolean;
          start_time?: string;
          starts_on?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_sessions_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "coach_sessions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_tasks: {
        Row: {
          athlete_id: string | null;
          created_at: string;
          created_by: string | null;
          done_at: string | null;
          done_by: string | null;
          due_on: string | null;
          id: string;
          organization_id: string;
          priority: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_on?: string | null;
          id?: string;
          organization_id: string;
          priority?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_on?: string | null;
          id?: string;
          organization_id?: string;
          priority?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_tasks_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "coach_tasks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          invited_by: string | null;
          organization_id: string;
          role: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          invited_by?: string | null;
          organization_id: string;
          role: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          invited_by?: string | null;
          organization_id?: string;
          role?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          slug: string;
          status: string;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          slug: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          created_at: string;
          is_active: boolean;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          is_active?: boolean;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          is_active?: boolean;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: { p_adult_confirmed: boolean; p_token_hash: string };
        Returns: string;
      };
      complete_signup: {
        Args: {
          p_first_name: string;
          p_kind: string;
          p_last_name: string;
          p_organization_name: string;
          p_phone: string;
          p_terms_version: string;
        };
        Returns: string;
      };
      current_user_is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      get_invitation: {
        Args: { p_token_hash: string };
        Returns: {
          athlete_name: string;
          email: string;
          expires_at: string;
          invite_status: string;
          organization_name: string;
        }[];
      };
      grant_health_consent: {
        Args: { p_athlete_id: string; p_coach_proof?: string };
        Returns: undefined;
      };
      move_session_series: {
        Args: { p_session_id: string; p_shift_days: number; p_start_time: string };
        Returns: undefined;
      };
      withdraw_health_consent: { Args: { p_athlete_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
