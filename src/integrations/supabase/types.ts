export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      artist_discography: {
        Row: {
          albums: Json
          artist_id: string
          artist_name: string
          created_at: string
          id: string
          last_updated: string
          singles: Json
        }
        Insert: {
          albums: Json
          artist_id: string
          artist_name: string
          created_at?: string
          id?: string
          last_updated?: string
          singles: Json
        }
        Update: {
          albums?: Json
          artist_id?: string
          artist_name?: string
          created_at?: string
          id?: string
          last_updated?: string
          singles?: Json
        }
        Relationships: []
      }
      catalog_valuations: {
        Row: {
          artist_name: string
          cash_flow_projections: Json | null
          catalog_age_years: number | null
          comparable_multiples: Json | null
          confidence_score: number | null
          created_at: string
          currency: string | null
          dcf_valuation: number | null
          discount_rate: number | null
          genre: string | null
          growth_assumptions: Json | null
          id: string
          ltm_revenue: number | null
          monthly_listeners: number | null
          multiple_valuation: number | null
          popularity_score: number | null
          risk_adjusted_value: number | null
          top_tracks: Json | null
          total_streams: number | null
          updated_at: string
          user_id: string
          valuation_amount: number | null
          valuation_methodology: string | null
        }
        Insert: {
          artist_name: string
          cash_flow_projections?: Json | null
          catalog_age_years?: number | null
          comparable_multiples?: Json | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          dcf_valuation?: number | null
          discount_rate?: number | null
          genre?: string | null
          growth_assumptions?: Json | null
          id?: string
          ltm_revenue?: number | null
          monthly_listeners?: number | null
          multiple_valuation?: number | null
          popularity_score?: number | null
          risk_adjusted_value?: number | null
          top_tracks?: Json | null
          total_streams?: number | null
          updated_at?: string
          user_id: string
          valuation_amount?: number | null
          valuation_methodology?: string | null
        }
        Update: {
          artist_name?: string
          cash_flow_projections?: Json | null
          catalog_age_years?: number | null
          comparable_multiples?: Json | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          dcf_valuation?: number | null
          discount_rate?: number | null
          genre?: string | null
          growth_assumptions?: Json | null
          id?: string
          ltm_revenue?: number | null
          monthly_listeners?: number | null
          multiple_valuation?: number | null
          popularity_score?: number | null
          risk_adjusted_value?: number | null
          top_tracks?: Json | null
          total_streams?: number | null
          updated_at?: string
          user_id?: string
          valuation_amount?: number | null
          valuation_methodology?: string | null
        }
        Relationships: []
      }
      deal_scenarios: {
        Row: {
          artist_id: string
          artist_name: string
          created_at: string
          deal_terms: Json
          id: string
          projections: Json
          scenario_name: string
          selected_tracks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_id: string
          artist_name: string
          created_at?: string
          deal_terms: Json
          id?: string
          projections: Json
          scenario_name: string
          selected_tracks: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          artist_name?: string
          created_at?: string
          deal_terms?: Json
          id?: string
          projections?: Json
          scenario_name?: string
          selected_tracks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      industry_benchmarks: {
        Row: {
          created_at: string
          genre: string
          growth_rate_assumption: number | null
          id: string
          last_updated: string
          market_risk_factor: number | null
          revenue_multiple_avg: number | null
          revenue_multiple_max: number | null
          revenue_multiple_min: number | null
          streams_to_revenue_ratio: number | null
        }
        Insert: {
          created_at?: string
          genre: string
          growth_rate_assumption?: number | null
          id?: string
          last_updated?: string
          market_risk_factor?: number | null
          revenue_multiple_avg?: number | null
          revenue_multiple_max?: number | null
          revenue_multiple_min?: number | null
          streams_to_revenue_ratio?: number | null
        }
        Update: {
          created_at?: string
          genre?: string
          growth_rate_assumption?: number | null
          id?: string
          last_updated?: string
          market_risk_factor?: number | null
          revenue_multiple_avg?: number | null
          revenue_multiple_max?: number | null
          revenue_multiple_min?: number | null
          streams_to_revenue_ratio?: number | null
        }
        Relationships: []
      }
      valuation_tiers: {
        Row: {
          created_at: string
          features_enabled: Json
          id: string
          max_valuations_per_month: number | null
          tier_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          features_enabled?: Json
          id?: string
          max_valuations_per_month?: number | null
          tier_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          features_enabled?: Json
          id?: string
          max_valuations_per_month?: number | null
          tier_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
