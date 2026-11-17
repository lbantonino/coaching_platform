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
      assistant_usage: {
        Row: {
          created_at: string;
          id: string;
          input_tokens: number | null;
          model: string | null;
          organization_id: string;
          output_tokens: number | null;
          status: string;
          steps: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          organization_id: string;
          output_tokens?: number | null;
          status?: string;
          steps?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          organization_id?: string;
          output_tokens?: number | null;
          status?: string;
          steps?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_usage_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
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
          target_time_seconds: number | null;
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
          target_time_seconds?: number | null;
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
          target_time_seconds?: number | null;
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
          client_address_line: string | null;
          client_city: string | null;
          client_country: string | null;
          client_name: string | null;
          client_postal_code: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          due_on: string;
          id: string;
          issued_at: string | null;
          issued_on: string;
          label: string;
          legal_entity_id: string | null;
          number: string | null;
          number_seq: number | null;
          number_year: number | null;
          organization_id: string;
          paid_on: string | null;
          payment_id: string | null;
          seller: Json | null;
          service_on: string | null;
          status: string;
          updated_at: string;
          vat_rate: number | null;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          athlete_id: string;
          client_address_line?: string | null;
          client_city?: string | null;
          client_country?: string | null;
          client_name?: string | null;
          client_postal_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          due_on: string;
          id?: string;
          issued_at?: string | null;
          issued_on: string;
          label: string;
          legal_entity_id?: string | null;
          number?: string | null;
          number_seq?: number | null;
          number_year?: number | null;
          organization_id: string;
          paid_on?: string | null;
          payment_id?: string | null;
          seller?: Json | null;
          service_on?: string | null;
          status?: string;
          updated_at?: string;
          vat_rate?: number | null;
        };
        Update: {
          amount_cents?: number;
          athlete_id?: string;
          client_address_line?: string | null;
          client_city?: string | null;
          client_country?: string | null;
          client_name?: string | null;
          client_postal_code?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          due_on?: string;
          id?: string;
          issued_at?: string | null;
          issued_on?: string;
          label?: string;
          legal_entity_id?: string | null;
          number?: string | null;
          number_seq?: number | null;
          number_year?: number | null;
          organization_id?: string;
          paid_on?: string | null;
          payment_id?: string | null;
          seller?: Json | null;
          service_on?: string | null;
          status?: string;
          updated_at?: string;
          vat_rate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_invoices_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "athlete_invoices_legal_entity_fkey";
            columns: ["legal_entity_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_legal_entities";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "athlete_invoices_payment_fkey";
            columns: ["payment_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_payments";
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
          athlete_id: string | null;
          covers_from: string | null;
          covers_to: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          id: string;
          label: string | null;
          method: string;
          organization_id: string;
          received_on: string;
          session_date: string | null;
          session_id: string | null;
          updated_at: string;
          vat_rate: number;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          athlete_id?: string | null;
          covers_from?: string | null;
          covers_to?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: string;
          label?: string | null;
          method: string;
          organization_id: string;
          received_on: string;
          session_date?: string | null;
          session_id?: string | null;
          updated_at?: string;
          vat_rate?: number;
        };
        Update: {
          amount_cents?: number;
          athlete_id?: string | null;
          covers_from?: string | null;
          covers_to?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: string;
          label?: string | null;
          method?: string;
          organization_id?: string;
          received_on?: string;
          session_date?: string | null;
          session_id?: string | null;
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
          {
            foreignKeyName: "athlete_payments_session_fkey";
            columns: ["session_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "coach_sessions";
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
          address_line: string | null;
          athlete_user_id: string | null;
          available_days: string[];
          city: string | null;
          country: string;
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
          postal_code: string | null;
          preferred_contact: string | null;
          program_type: string | null;
          schedule_constraints: string | null;
          sessions_per_week: number | null;
          sex: string | null;
          status: string;
          training_places: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address_line?: string | null;
          athlete_user_id?: string | null;
          available_days?: string[];
          city?: string | null;
          country?: string;
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
          postal_code?: string | null;
          preferred_contact?: string | null;
          program_type?: string | null;
          schedule_constraints?: string | null;
          sessions_per_week?: number | null;
          sex?: string | null;
          status?: string;
          training_places?: string[];
          updated_at?: string;
        };
        Update: {
          address_line?: string | null;
          athlete_user_id?: string | null;
          available_days?: string[];
          city?: string | null;
          country?: string;
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
          postal_code?: string | null;
          preferred_contact?: string | null;
          program_type?: string | null;
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
          exercise_id: string | null;
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
          exercise_id?: string | null;
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
          exercise_id?: string | null;
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
          {
            foreignKeyName: "athlete_reference_metrics_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_documents: {
        Row: {
          athlete_id: string | null;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          mime_type: string;
          name: string;
          organization_id: string;
          size_bytes: number;
          storage_path: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          mime_type: string;
          name: string;
          organization_id: string;
          size_bytes: number;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          athlete_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          mime_type?: string;
          name?: string;
          organization_id?: string;
          size_bytes?: number;
          storage_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_documents_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "coach_documents_category_fkey";
            columns: ["category_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "document_categories";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "coach_documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_expenses: {
        Row: {
          amount_cents: number;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          ends_on: string | null;
          id: string;
          label: string;
          organization_id: string;
          repeats_monthly: boolean;
          spent_on: string;
          updated_at: string;
          vat_rate: number;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          ends_on?: string | null;
          id?: string;
          label: string;
          organization_id: string;
          repeats_monthly?: boolean;
          spent_on: string;
          updated_at?: string;
          vat_rate?: number;
        };
        Update: {
          amount_cents?: number;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          ends_on?: string | null;
          id?: string;
          label?: string;
          organization_id?: string;
          repeats_monthly?: boolean;
          spent_on?: string;
          updated_at?: string;
          vat_rate?: number;
        };
        Relationships: [
          {
            foreignKeyName: "coach_expenses_category_id_organization_id_fkey";
            columns: ["category_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "coach_expenses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_notification_states: {
        Row: {
          deleted_at: string | null;
          dismissed_at: string | null;
          key: string;
          organization_id: string;
          read_at: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          deleted_at?: string | null;
          dismissed_at?: string | null;
          key: string;
          organization_id: string;
          read_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          deleted_at?: string | null;
          dismissed_at?: string | null;
          key?: string;
          organization_id?: string;
          read_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_notification_states_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_profiles: {
        Row: {
          agenda_first_hour: number;
          agenda_last_hour: number;
          company_name: string | null;
          created_at: string;
          default_location: string | null;
          default_payment_method: string;
          default_price_cents: number | null;
          default_session_minutes: number;
          first_name: string | null;
          invoice_cash: boolean;
          last_name: string | null;
          notify_competitions: boolean;
          notify_messages: boolean;
          notify_profiles: boolean;
          notify_tasks: boolean;
          notify_unpaid: boolean;
          phone: string | null;
          photo_path: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          agenda_first_hour?: number;
          agenda_last_hour?: number;
          company_name?: string | null;
          created_at?: string;
          default_location?: string | null;
          default_payment_method?: string;
          default_price_cents?: number | null;
          default_session_minutes?: number;
          first_name?: string | null;
          invoice_cash?: boolean;
          last_name?: string | null;
          notify_competitions?: boolean;
          notify_messages?: boolean;
          notify_profiles?: boolean;
          notify_tasks?: boolean;
          notify_unpaid?: boolean;
          phone?: string | null;
          photo_path?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          agenda_first_hour?: number;
          agenda_last_hour?: number;
          company_name?: string | null;
          created_at?: string;
          default_location?: string | null;
          default_payment_method?: string;
          default_price_cents?: number | null;
          default_session_minutes?: number;
          first_name?: string | null;
          invoice_cash?: boolean;
          last_name?: string | null;
          notify_competitions?: boolean;
          notify_messages?: boolean;
          notify_profiles?: boolean;
          notify_tasks?: boolean;
          notify_unpaid?: boolean;
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
          currency: string;
          discipline: string | null;
          duration_minutes: number;
          ends_on: string | null;
          id: string;
          kind: string;
          location: string | null;
          notes: string | null;
          organization_id: string;
          payment_method: string | null;
          price_cents: number | null;
          price_vat_included: boolean;
          repeats_weekly: boolean;
          start_time: string;
          starts_on: string;
          title: string;
          updated_at: string;
          vat_rate: number;
        };
        ComputedFields: never;
        Insert: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          discipline?: string | null;
          duration_minutes: number;
          ends_on?: string | null;
          id?: string;
          kind: string;
          location?: string | null;
          notes?: string | null;
          organization_id: string;
          payment_method?: string | null;
          price_cents?: number | null;
          price_vat_included?: boolean;
          repeats_weekly?: boolean;
          start_time: string;
          starts_on: string;
          title: string;
          updated_at?: string;
          vat_rate?: number;
        };
        Update: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          discipline?: string | null;
          duration_minutes?: number;
          ends_on?: string | null;
          id?: string;
          kind?: string;
          location?: string | null;
          notes?: string | null;
          organization_id?: string;
          payment_method?: string | null;
          price_cents?: number | null;
          price_vat_included?: boolean;
          repeats_weekly?: boolean;
          start_time?: string;
          starts_on?: string;
          title?: string;
          updated_at?: string;
          vat_rate?: number;
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
      coach_task_lists: {
        Row: {
          color: string;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          organization_id: string;
          position: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          position?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_task_lists_organization_id_fkey";
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
          category: string | null;
          created_at: string;
          created_by: string | null;
          done_at: string | null;
          done_by: string | null;
          due_on: string | null;
          id: string;
          list_id: string | null;
          notes: string | null;
          organization_id: string;
          priority: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          athlete_id?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_on?: string | null;
          id?: string;
          list_id?: string | null;
          notes?: string | null;
          organization_id: string;
          priority?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          athlete_id?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_on?: string | null;
          id?: string;
          list_id?: string | null;
          notes?: string | null;
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
            foreignKeyName: "coach_tasks_list_fkey";
            columns: ["list_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "coach_task_lists";
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
      document_categories: {
        Row: {
          color: string;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_favorites: {
        Row: {
          created_at: string;
          exercise_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          exercise_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_favorites_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          aliases_en: string[];
          aliases_fr: string[];
          archived_at: string | null;
          attribution_required: boolean;
          bodyweight: boolean;
          category: string;
          created_at: string;
          created_by: string | null;
          difficulty: string | null;
          disciplines: string[];
          equipment: string[];
          exportable: boolean;
          family: string | null;
          hyrox_station: number | null;
          id: string;
          image_end: string | null;
          image_main: string | null;
          image_source: string | null;
          image_start: string | null;
          instructions_fr: string[];
          key: string | null;
          metrics: string[];
          name_en: string | null;
          name_fr: string;
          organization_id: string | null;
          primary_muscles: string[];
          review_status: string;
          secondary_muscles: string[];
          source: string;
          source_ids: string[];
          tags: string[];
          unilateral: boolean;
          updated_at: string;
          variant_of: string | null;
          video_url: string | null;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          aliases_en?: string[];
          aliases_fr?: string[];
          archived_at?: string | null;
          attribution_required?: boolean;
          bodyweight?: boolean;
          category: string;
          created_at?: string;
          created_by?: string | null;
          difficulty?: string | null;
          disciplines?: string[];
          equipment?: string[];
          exportable?: boolean;
          family?: string | null;
          hyrox_station?: number | null;
          id?: string;
          image_end?: string | null;
          image_main?: string | null;
          image_source?: string | null;
          image_start?: string | null;
          instructions_fr?: string[];
          key?: string | null;
          metrics?: string[];
          name_en?: string | null;
          name_fr: string;
          organization_id?: string | null;
          primary_muscles?: string[];
          review_status?: string;
          secondary_muscles?: string[];
          source: string;
          source_ids?: string[];
          tags?: string[];
          unilateral?: boolean;
          updated_at?: string;
          variant_of?: string | null;
          video_url?: string | null;
          visibility?: string;
        };
        Update: {
          aliases_en?: string[];
          aliases_fr?: string[];
          archived_at?: string | null;
          attribution_required?: boolean;
          bodyweight?: boolean;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          difficulty?: string | null;
          disciplines?: string[];
          equipment?: string[];
          exportable?: boolean;
          family?: string | null;
          hyrox_station?: number | null;
          id?: string;
          image_end?: string | null;
          image_main?: string | null;
          image_source?: string | null;
          image_start?: string | null;
          instructions_fr?: string[];
          key?: string | null;
          metrics?: string[];
          name_en?: string | null;
          name_fr?: string;
          organization_id?: string | null;
          primary_muscles?: string[];
          review_status?: string;
          secondary_muscles?: string[];
          source?: string;
          source_ids?: string[];
          tags?: string[];
          unilateral?: boolean;
          updated_at?: string;
          variant_of?: string | null;
          video_url?: string | null;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_variant_of_fkey";
            columns: ["variant_of"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_categories: {
        Row: {
          color: string;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_currency_changes: {
        Row: {
          changed_on: string;
          created_at: string;
          created_by: string | null;
          from_currency: string;
          id: string;
          organization_id: string;
          rate: number;
          to_currency: string;
        };
        ComputedFields: never;
        Insert: {
          changed_on: string;
          created_at?: string;
          created_by?: string | null;
          from_currency: string;
          id?: string;
          organization_id: string;
          rate: number;
          to_currency: string;
        };
        Update: {
          changed_on?: string;
          created_at?: string;
          created_by?: string | null;
          from_currency?: string;
          id?: string;
          organization_id?: string;
          rate?: number;
          to_currency?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_currency_changes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_legal_entities: {
        Row: {
          address_line: string | null;
          bic: string | null;
          billing_email: string | null;
          city: string | null;
          country: string;
          created_at: string;
          created_by: string | null;
          default_vat_rate: number | null;
          enterprise_number: string | null;
          iban: string | null;
          id: string;
          invoice_prefix: string;
          is_default: boolean;
          legal_form: string;
          legal_mentions: string | null;
          name: string;
          organization_id: string;
          payment_details: string | null;
          postal_code: string | null;
          updated_at: string;
          vat_number: string | null;
          vat_status: string;
        };
        ComputedFields: never;
        Insert: {
          address_line?: string | null;
          bic?: string | null;
          billing_email?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          default_vat_rate?: number | null;
          enterprise_number?: string | null;
          iban?: string | null;
          id?: string;
          invoice_prefix?: string;
          is_default?: boolean;
          legal_form: string;
          legal_mentions?: string | null;
          name: string;
          organization_id: string;
          payment_details?: string | null;
          postal_code?: string | null;
          updated_at?: string;
          vat_number?: string | null;
          vat_status: string;
        };
        Update: {
          address_line?: string | null;
          bic?: string | null;
          billing_email?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          default_vat_rate?: number | null;
          enterprise_number?: string | null;
          iban?: string | null;
          id?: string;
          invoice_prefix?: string;
          is_default?: boolean;
          legal_form?: string;
          legal_mentions?: string | null;
          name?: string;
          organization_id?: string;
          payment_details?: string | null;
          postal_code?: string | null;
          updated_at?: string;
          vat_number?: string | null;
          vat_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_legal_entities_organization_id_fkey";
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
          coory_plan: string;
          country: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          id: string;
          name: string;
          slug: string;
          status: string;
          timezone: string;
          updated_at: string;
          vat_rate: number;
        };
        ComputedFields: never;
        Insert: {
          coory_plan?: string;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: string;
          name: string;
          slug: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
          vat_rate?: number;
        };
        Update: {
          coory_plan?: string;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: string;
          name?: string;
          slug?: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
          vat_rate?: number;
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
      program_drafts: {
        Row: {
          draft_json: NonNullable<Json>;
          organization_id: string;
          program_id: string;
          revision: number;
          schema_version: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          draft_json: NonNullable<Json>;
          organization_id: string;
          program_id: string;
          revision?: number;
          schema_version?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          draft_json?: NonNullable<Json>;
          organization_id?: string;
          program_id?: string;
          revision?: number;
          schema_version?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_drafts_program_id_organization_id_fkey";
            columns: ["program_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      program_publications: {
        Row: {
          id: string;
          number: number;
          organization_id: string;
          program_id: string;
          published_at: string;
          published_by: string | null;
          schema_version: number;
          snapshot_json: NonNullable<Json>;
          source_revision: number | null;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          number: number;
          organization_id: string;
          program_id: string;
          published_at?: string;
          published_by?: string | null;
          schema_version?: number;
          snapshot_json: NonNullable<Json>;
          source_revision?: number | null;
        };
        Update: {
          id?: string;
          number?: number;
          organization_id?: string;
          program_id?: string;
          published_at?: string;
          published_by?: string | null;
          schema_version?: number;
          snapshot_json?: NonNullable<Json>;
          source_revision?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_publications_program_id_organization_id_fkey";
            columns: ["program_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      program_templates: {
        Row: {
          archived_at: string | null;
          content_json: NonNullable<Json>;
          created_at: string;
          created_by: string | null;
          discipline: string;
          id: string;
          organization_id: string | null;
          origin: string;
          schema_version: number;
          sessions_per_week: number;
          title: string;
          updated_at: string;
          version: number;
          weeks_count: number;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          content_json: NonNullable<Json>;
          created_at?: string;
          created_by?: string | null;
          discipline: string;
          id?: string;
          organization_id?: string | null;
          origin: string;
          schema_version?: number;
          sessions_per_week: number;
          title: string;
          updated_at?: string;
          version?: number;
          weeks_count: number;
        };
        Update: {
          archived_at?: string | null;
          content_json?: NonNullable<Json>;
          created_at?: string;
          created_by?: string | null;
          discipline?: string;
          id?: string;
          organization_id?: string | null;
          origin?: string;
          schema_version?: number;
          sessions_per_week?: number;
          title?: string;
          updated_at?: string;
          version?: number;
          weeks_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "program_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      programs: {
        Row: {
          active_publication_id: string | null;
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          discipline: string | null;
          goal: string | null;
          id: string;
          organization_id: string;
          source_template_id: string | null;
          source_template_version: number | null;
          start_date: string;
          status: string;
          title: string;
          updated_at: string;
          weeks_count: number;
        };
        ComputedFields: never;
        Insert: {
          active_publication_id?: string | null;
          athlete_id: string;
          created_at?: string;
          created_by?: string | null;
          discipline?: string | null;
          goal?: string | null;
          id?: string;
          organization_id: string;
          source_template_id?: string | null;
          source_template_version?: number | null;
          start_date: string;
          status?: string;
          title: string;
          updated_at?: string;
          weeks_count: number;
        };
        Update: {
          active_publication_id?: string | null;
          athlete_id?: string;
          created_at?: string;
          created_by?: string | null;
          discipline?: string | null;
          goal?: string | null;
          id?: string;
          organization_id?: string;
          source_template_id?: string | null;
          source_template_version?: number | null;
          start_date?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          weeks_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "programs_active_publication_fkey";
            columns: ["active_publication_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "program_publications";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "programs_athlete_id_organization_id_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athlete_profiles";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "programs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_source_template_id_fkey";
            columns: ["source_template_id"];
            isOneToOne: false;
            referencedRelation: "program_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      publication_sessions: {
        Row: {
          id: string;
          organization_id: string;
          planned_date: string | null;
          planned_time: string | null;
          publication_id: string;
          session_json: NonNullable<Json>;
          slot_index: number;
          source_session_key: string;
          week_index: number;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          organization_id: string;
          planned_date?: string | null;
          planned_time?: string | null;
          publication_id: string;
          session_json: NonNullable<Json>;
          slot_index: number;
          source_session_key: string;
          week_index: number;
        };
        Update: {
          id?: string;
          organization_id?: string;
          planned_date?: string | null;
          planned_time?: string | null;
          publication_id?: string;
          session_json?: NonNullable<Json>;
          slot_index?: number;
          source_session_key?: string;
          week_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "publication_sessions_publication_id_organization_id_fkey";
            columns: ["publication_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "program_publications";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      session_templates: {
        Row: {
          archived_at: string | null;
          content_json: NonNullable<Json>;
          created_at: string;
          created_by: string | null;
          discipline: string;
          id: string;
          organization_id: string | null;
          origin: string;
          schema_version: number;
          session_type: string;
          title: string;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          content_json: NonNullable<Json>;
          created_at?: string;
          created_by?: string | null;
          discipline: string;
          id?: string;
          organization_id?: string | null;
          origin: string;
          schema_version?: number;
          session_type: string;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          content_json?: NonNullable<Json>;
          created_at?: string;
          created_by?: string | null;
          discipline?: string;
          id?: string;
          organization_id?: string | null;
          origin?: string;
          schema_version?: number;
          session_type?: string;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "session_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
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
      archive_program: { Args: { p_program_id: string }; Returns: undefined };
      assistant_access_allowed: { Args: { p_organization_id: string }; Returns: boolean };
      before_user_created_access_code: { Args: { event: Json }; Returns: Json };
      change_organization_currency: {
        Args: { p_currency: string; p_organization_id: string; p_rate: number };
        Returns: Json;
      };
      complete_signup: {
        Args: {
          p_country?: string;
          p_currency?: string;
          p_first_name: string;
          p_kind: string;
          p_last_name: string;
          p_organization_name: string;
          p_phone: string;
          p_terms_version: string;
          p_vat_rate?: number;
        };
        Returns: string;
      };
      continue_assistant_use: {
        Args: { p_id: string; p_organization_id: string };
        Returns: number;
      };
      create_program: {
        Args: {
          p_athlete_id: string;
          p_discipline: string;
          p_draft: Json;
          p_organization_id: string;
          p_source_template_id?: string;
          p_source_template_version?: number;
          p_start_date: string;
          p_title: string;
          p_weeks_count: number;
        };
        Returns: string;
      };
      current_user_is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      delete_program: {
        Args: { p_organization_id: string; p_program_id: string };
        Returns: undefined;
      };
      finish_assistant_use: {
        Args: {
          p_id: string;
          p_input_tokens: number;
          p_model: string;
          p_output_tokens: number;
          p_status: string;
        };
        Returns: undefined;
      };
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
      is_demo_account: { Args: Record<PropertyKey, never>; Returns: boolean };
      issue_athlete_invoice: { Args: { p_invoice_id: string }; Returns: string };
      mark_athlete_invoice_paid: {
        Args: { p_invoice_id: string; p_method: string; p_received_on: string };
        Returns: string;
      };
      move_session_series: {
        Args: { p_session_id: string; p_shift_days: number; p_start_time: string };
        Returns: undefined;
      };
      publish_program: {
        Args: {
          p_discipline: string;
          p_expected_revision: number;
          p_program_id: string;
          p_sessions: Json;
          p_snapshot: Json;
          p_start_date: string;
          p_title: string;
          p_weeks_count: number;
        };
        Returns: number;
      };
      reserve_assistant_use: { Args: { p_organization_id: string }; Returns: string };
      save_program_draft: {
        Args: {
          p_discipline: string;
          p_draft: Json;
          p_expected_revision: number;
          p_program_id: string;
          p_start_date: string;
          p_title: string;
          p_weeks_count: number;
        };
        Returns: number;
      };
      unarchive_program: { Args: { p_program_id: string }; Returns: string };
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
