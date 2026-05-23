export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      alert_deliveries: {
        Row: {
          alert_id: string;
          channel: string;
          created_at: string;
          delivered_at: string | null;
          delivery_group_key: string | null;
          delivery_status: Database["public"]["Enums"]["alert_delivery_status_type"];
          error_message: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          alert_id: string;
          channel: string;
          created_at?: string;
          delivered_at?: string | null;
          delivery_group_key?: string | null;
          delivery_status?: Database["public"]["Enums"]["alert_delivery_status_type"];
          error_message?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          alert_id?: string;
          channel?: string;
          created_at?: string;
          delivered_at?: string | null;
          delivery_group_key?: string | null;
          delivery_status?: Database["public"]["Enums"]["alert_delivery_status_type"];
          error_message?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alert_deliveries_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alert_deliveries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      alerts: {
        Row: {
          alert_date: string;
          alert_level: Database["public"]["Enums"]["alert_level_type"];
          alert_type: string;
          cat_id: string;
          condition_key: string;
          created_at: string;
          daily_health_record_id: string | null;
          id: string;
          is_active: boolean;
          message: string;
          message_language_code: string;
          metadata: Json;
          metric: string | null;
          rule_key: string;
        };
        Insert: {
          alert_date: string;
          alert_level: Database["public"]["Enums"]["alert_level_type"];
          alert_type: string;
          cat_id: string;
          condition_key: string;
          created_at?: string;
          daily_health_record_id?: string | null;
          id?: string;
          is_active?: boolean;
          message: string;
          message_language_code: string;
          metadata?: Json;
          metric?: string | null;
          rule_key: string;
        };
        Update: {
          alert_date?: string;
          alert_level?: Database["public"]["Enums"]["alert_level_type"];
          alert_type?: string;
          cat_id?: string;
          condition_key?: string;
          created_at?: string;
          daily_health_record_id?: string | null;
          id?: string;
          is_active?: boolean;
          message?: string;
          message_language_code?: string;
          metadata?: Json;
          metric?: string | null;
          rule_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_cat_id_fkey";
            columns: ["cat_id"];
            isOneToOne: false;
            referencedRelation: "cats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_daily_health_record_id_fkey";
            columns: ["daily_health_record_id"];
            isOneToOne: false;
            referencedRelation: "daily_health_records";
            referencedColumns: ["id"];
          },
        ];
      };
      cat_collaborators: {
        Row: {
          cat_id: string;
          created_at: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["collaborator_role_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          invited_by?: string | null;
          role: Database["public"]["Enums"]["collaborator_role_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["collaborator_role_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cat_collaborators_cat_id_fkey";
            columns: ["cat_id"];
            isOneToOne: false;
            referencedRelation: "cats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cat_collaborators_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cat_collaborators_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cat_notification_preferences: {
        Row: {
          cat_id: string;
          created_at: string;
          email_daily_digest: boolean;
          email_important_alerts: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          email_daily_digest?: boolean;
          email_important_alerts?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          email_daily_digest?: boolean;
          email_important_alerts?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cat_notification_preferences_cat_id_fkey";
            columns: ["cat_id"];
            isOneToOne: false;
            referencedRelation: "cats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cat_notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cat_alert_evaluation_queue: {
        Row: {
          activity_version: number;
          cat_id: string;
          created_at: string;
          due_at: string;
          last_activity_at: string;
          last_error: string | null;
          last_processed_at: string | null;
          processing_started_at: string | null;
          processing_version: number | null;
          updated_at: string;
        };
        Insert: {
          activity_version?: number;
          cat_id: string;
          created_at?: string;
          due_at: string;
          last_activity_at: string;
          last_error?: string | null;
          last_processed_at?: string | null;
          processing_started_at?: string | null;
          processing_version?: number | null;
          updated_at?: string;
        };
        Update: {
          activity_version?: number;
          cat_id?: string;
          created_at?: string;
          due_at?: string;
          last_activity_at?: string;
          last_error?: string | null;
          last_processed_at?: string | null;
          processing_started_at?: string | null;
          processing_version?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cat_alert_evaluation_queue_cat_id_fkey";
            columns: ["cat_id"];
            isOneToOne: true;
            referencedRelation: "cats";
            referencedColumns: ["id"];
          },
        ];
      };
      cats: {
        Row: {
          age_months: number;
          breed: string | null;
          created_at: string;
          gender: Database["public"]["Enums"]["cat_gender"];
          id: string;
          initial_weight_kg: number;
          is_on_medication: boolean;
          last_vet_visit_date: string | null;
          name: string;
          owner_user_id: string;
          personality: string | null;
          primary_diet: Database["public"]["Enums"]["cat_diet"] | null;
          underlying_health_conditions: string[];
          updated_at: string;
        };
        Insert: {
          age_months: number;
          breed?: string | null;
          created_at?: string;
          gender: Database["public"]["Enums"]["cat_gender"];
          id?: string;
          initial_weight_kg: number;
          is_on_medication?: boolean;
          last_vet_visit_date?: string | null;
          name: string;
          owner_user_id: string;
          personality?: string | null;
          primary_diet?: Database["public"]["Enums"]["cat_diet"] | null;
          underlying_health_conditions?: string[];
          updated_at?: string;
        };
        Update: {
          age_months?: number;
          breed?: string | null;
          created_at?: string;
          gender?: Database["public"]["Enums"]["cat_gender"];
          id?: string;
          initial_weight_kg?: number;
          is_on_medication?: boolean;
          last_vet_visit_date?: string | null;
          name?: string;
          owner_user_id?: string;
          personality?: string | null;
          primary_diet?: Database["public"]["Enums"]["cat_diet"] | null;
          underlying_health_conditions?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cats_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_health_records: {
        Row: {
          abnormal_behavior: boolean | null;
          abnormal_behavior_note: string | null;
          activity_score: number | null;
          appetite_score: number | null;
          cat_id: string;
          created_at: string;
          created_by: string | null;
          feeding_time: string | null;
          food_amount_grams: number | null;
          food_brand: string | null;
          food_ratio: number | null;
          food_type: Database["public"]["Enums"]["cat_diet"] | null;
          gum_appearance:
            | Database["public"]["Enums"]["gum_appearance_type"]
            | null;
          id: string;
          medication_taken:
            | Database["public"]["Enums"]["medication_status_type"]
            | null;
          notes: string | null;
          record_date: string;
          resting_breath_rate:
            | Database["public"]["Enums"]["breath_rate_zone"]
            | null;
          stool_condition:
            | Database["public"]["Enums"]["stool_condition_type"]
            | null;
          suggested_food_grams: number | null;
          tear_staining: boolean | null;
          updated_at: string;
          urine_times:
            | Database["public"]["Enums"]["urine_frequency_type"]
            | null;
          vomit_times: number;
          water_intake:
            | Database["public"]["Enums"]["water_intake_level"]
            | null;
          weight_kg: number | null;
        };
        Insert: {
          abnormal_behavior?: boolean | null;
          abnormal_behavior_note?: string | null;
          activity_score?: number | null;
          appetite_score?: number | null;
          cat_id: string;
          created_at?: string;
          created_by?: string | null;
          feeding_time?: string | null;
          food_amount_grams?: number | null;
          food_brand?: string | null;
          food_ratio?: number | null;
          food_type?: Database["public"]["Enums"]["cat_diet"] | null;
          gum_appearance?:
            | Database["public"]["Enums"]["gum_appearance_type"]
            | null;
          id?: string;
          medication_taken?:
            | Database["public"]["Enums"]["medication_status_type"]
            | null;
          notes?: string | null;
          record_date: string;
          resting_breath_rate?:
            | Database["public"]["Enums"]["breath_rate_zone"]
            | null;
          stool_condition?:
            | Database["public"]["Enums"]["stool_condition_type"]
            | null;
          suggested_food_grams?: number | null;
          tear_staining?: boolean | null;
          updated_at?: string;
          urine_times?:
            | Database["public"]["Enums"]["urine_frequency_type"]
            | null;
          vomit_times?: number;
          water_intake?:
            | Database["public"]["Enums"]["water_intake_level"]
            | null;
          weight_kg?: number | null;
        };
        Update: {
          abnormal_behavior?: boolean | null;
          abnormal_behavior_note?: string | null;
          activity_score?: number | null;
          appetite_score?: number | null;
          cat_id?: string;
          created_at?: string;
          created_by?: string | null;
          feeding_time?: string | null;
          food_amount_grams?: number | null;
          food_brand?: string | null;
          food_ratio?: number | null;
          food_type?: Database["public"]["Enums"]["cat_diet"] | null;
          gum_appearance?:
            | Database["public"]["Enums"]["gum_appearance_type"]
            | null;
          id?: string;
          medication_taken?:
            | Database["public"]["Enums"]["medication_status_type"]
            | null;
          notes?: string | null;
          record_date?: string;
          resting_breath_rate?:
            | Database["public"]["Enums"]["breath_rate_zone"]
            | null;
          stool_condition?:
            | Database["public"]["Enums"]["stool_condition_type"]
            | null;
          suggested_food_grams?: number | null;
          tear_staining?: boolean | null;
          updated_at?: string;
          urine_times?:
            | Database["public"]["Enums"]["urine_frequency_type"]
            | null;
          vomit_times?: number;
          water_intake?:
            | Database["public"]["Enums"]["water_intake_level"]
            | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_health_records_cat_id_fkey";
            columns: ["cat_id"];
            isOneToOne: false;
            referencedRelation: "cats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_health_records_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback_messages: {
        Row: {
          alert_level: Database["public"]["Enums"]["alert_level_type"];
          condition_key: string;
          created_at: string;
          id: number;
          is_active: boolean;
          language_code: string;
          message: string;
          metric: string;
          updated_at: string;
        };
        Insert: {
          alert_level: Database["public"]["Enums"]["alert_level_type"];
          condition_key: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          language_code?: string;
          message: string;
          metric: string;
          updated_at?: string;
        };
        Update: {
          alert_level?: Database["public"]["Enums"]["alert_level_type"];
          condition_key?: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          language_code?: string;
          message?: string;
          metric?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          household_cat_count: number | null;
          id: string;
          job_status: string | null;
          language_code: string;
          last_vet_visit_self: string | null;
          updated_at: string;
          years_owning_cat: number | null;
        };
        Insert: {
          age?: number | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          household_cat_count?: number | null;
          id: string;
          job_status?: string | null;
          language_code?: string;
          last_vet_visit_self?: string | null;
          updated_at?: string;
          years_owning_cat?: number | null;
        };
        Update: {
          age?: number | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          household_cat_count?: number | null;
          id?: string;
          job_status?: string | null;
          language_code?: string;
          last_vet_visit_self?: string | null;
          updated_at?: string;
          years_owning_cat?: number | null;
        };
        Relationships: [];
      };
      vet_visits: {
        Row: {
          cat_id: string;
          created_at: string;
          created_by: string | null;
          has_prescription: boolean;
          id: string;
          notes: string | null;
          reason: string;
          updated_at: string;
          visit_date: string;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          created_by?: string | null;
          has_prescription?: boolean;
          id?: string;
          notes?: string | null;
          reason: string;
          updated_at?: string;
          visit_date: string;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          created_by?: string | null;
          has_prescription?: boolean;
          id?: string;
          notes?: string | null;
          reason?: string;
          updated_at?: string;
          visit_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vet_visits_cat_id_fkey";
            columns: ["cat_id"];
            isOneToOne: false;
            referencedRelation: "cats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vet_visits_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_daily_health_record_log: {
        Args: {
          p_cat_id: string;
          p_record_date: string;
          p_feeding_time?: string | null;
          p_food_type?: Database["public"]["Enums"]["cat_diet"] | null;
          p_food_amount_grams?: number | null;
          p_appetite_score?: number | null;
          p_food_brand?: string | null;
          p_suggested_food_grams?: number | null;
          p_water_intake?: Database["public"]["Enums"]["water_intake_level"] | null;
          p_stool_condition?: Database["public"]["Enums"]["stool_condition_type"] | null;
          p_urine_times?: Database["public"]["Enums"]["urine_frequency_type"] | null;
          p_activity_score?: number | null;
          p_resting_breath_rate?: Database["public"]["Enums"]["breath_rate_zone"] | null;
          p_vomit_times?: number | null;
          p_tear_staining?: boolean | null;
          p_abnormal_behavior?: boolean | null;
          p_abnormal_behavior_note?: string | null;
          p_gum_appearance?: Database["public"]["Enums"]["gum_appearance_type"] | null;
          p_medication_taken?: Database["public"]["Enums"]["medication_status_type"] | null;
          p_weight_kg?: number | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      alert_delivery_status_type: "pending" | "sent" | "failed" | "skipped";
      alert_level_type: "normal" | "caution" | "vet_recommended" | "emergency";
      breath_rate_zone:
        | "range_15_30"
        | "less_than_15"
        | "range_31_40"
        | "greater_than_40";
      cat_diet: "dry" | "wet" | "both";
      cat_gender: "male" | "female" | "neutered_male" | "neutered_female";
      collaborator_role_type: "caretaker" | "viewer";
      gum_appearance_type: "normal" | "red" | "pale" | "foul_odor";
      medication_status_type: "taken" | "missed" | "not_required";
      stool_condition_type: "normal" | "soft" | "watery" | "constipated";
      urine_frequency_type: "less_than_2" | "two_to_three" | "more_than_4";
      water_intake_level: "low" | "normal" | "high";
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      alert_delivery_status_type: ["pending", "sent", "failed", "skipped"],
      alert_level_type: ["normal", "caution", "vet_recommended", "emergency"],
      breath_rate_zone: [
        "range_15_30",
        "less_than_15",
        "range_31_40",
        "greater_than_40",
      ],
      cat_diet: ["dry", "wet", "both"],
      cat_gender: ["male", "female", "neutered_male", "neutered_female"],
      collaborator_role_type: ["caretaker", "viewer"],
      gum_appearance_type: ["normal", "red", "pale", "foul_odor"],
      medication_status_type: ["taken", "missed", "not_required"],
      stool_condition_type: ["normal", "soft", "watery", "constipated"],
      urine_frequency_type: ["less_than_2", "two_to_three", "more_than_4"],
      water_intake_level: ["low", "normal", "high"],
    },
  },
} as const;
