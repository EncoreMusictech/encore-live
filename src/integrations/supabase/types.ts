export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ack_processing_logs: {
        Row: {
          ack_file_content: string | null
          ack_file_name: string
          created_at: string
          errors_found: number | null
          id: string
          parsed_data: Json | null
          processed_at: string | null
          processing_errors: Json | null
          processing_status: string
          updated_at: string
          user_id: string
          works_updated: number | null
        }
        Insert: {
          ack_file_content?: string | null
          ack_file_name: string
          created_at?: string
          errors_found?: number | null
          id?: string
          parsed_data?: Json | null
          processed_at?: string | null
          processing_errors?: Json | null
          processing_status?: string
          updated_at?: string
          user_id: string
          works_updated?: number | null
        }
        Update: {
          ack_file_content?: string | null
          ack_file_name?: string
          created_at?: string
          errors_found?: number | null
          id?: string
          parsed_data?: Json | null
          processed_at?: string | null
          processing_errors?: Json | null
          processing_status?: string
          updated_at?: string
          user_id?: string
          works_updated?: number | null
        }
        Relationships: []
      }
      ai_research_sessions: {
        Row: {
          ai_response: Json | null
          confidence_assessment: number | null
          created_at: string
          findings_summary: string | null
          id: string
          processing_time_ms: number | null
          research_query: string
          search_id: string
          session_status: string | null
          session_type: string
          sources_checked: string[] | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          ai_response?: Json | null
          confidence_assessment?: number | null
          created_at?: string
          findings_summary?: string | null
          id?: string
          processing_time_ms?: number | null
          research_query: string
          search_id: string
          session_status?: string | null
          session_type: string
          sources_checked?: string[] | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          ai_response?: Json | null
          confidence_assessment?: number | null
          created_at?: string
          findings_summary?: string | null
          id?: string
          processing_time_ms?: number | null
          research_query?: string
          search_id?: string
          session_status?: string | null
          session_type?: string
          sources_checked?: string[] | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_research_sessions_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "song_catalog_searches"
            referencedColumns: ["id"]
          },
        ]
      }
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
      automation_workflows: {
        Row: {
          action_sequence: Json
          created_at: string
          created_by_user_id: string
          execution_settings: Json
          failure_count: number
          id: string
          is_active: boolean
          last_execution_at: string | null
          last_execution_status: string | null
          success_count: number
          trigger_conditions: Json
          updated_at: string
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          action_sequence?: Json
          created_at?: string
          created_by_user_id: string
          execution_settings?: Json
          failure_count?: number
          id?: string
          is_active?: boolean
          last_execution_at?: string | null
          last_execution_status?: string | null
          success_count?: number
          trigger_conditions?: Json
          updated_at?: string
          workflow_name: string
          workflow_type: string
        }
        Update: {
          action_sequence?: Json
          created_at?: string
          created_by_user_id?: string
          execution_settings?: Json
          failure_count?: number
          id?: string
          is_active?: boolean
          last_execution_at?: string | null
          last_execution_status?: string | null
          success_count?: number
          trigger_conditions?: Json
          updated_at?: string
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: []
      }
      blockchain_admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      blockchain_transactions: {
        Row: {
          created_at: string | null
          gas_price: number | null
          gas_used: number | null
          id: string
          metadata: Json | null
          network: string
          status: string
          transaction_hash: string
          transaction_type: string
          updated_at: string | null
          user_id: string
          value_eth: number | null
        }
        Insert: {
          created_at?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          network?: string
          status?: string
          transaction_hash: string
          transaction_type: string
          updated_at?: string | null
          user_id: string
          value_eth?: number | null
        }
        Update: {
          created_at?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          network?: string
          status?: string
          transaction_hash?: string
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
          value_eth?: number | null
        }
        Relationships: []
      }
      bundle_products: {
        Row: {
          annual_price: number | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          features: Json | null
          id: string
          included_modules: string[]
          is_active: boolean | null
          is_popular: boolean | null
          monthly_price: number
          name: string
          updated_at: string | null
        }
        Insert: {
          annual_price?: number | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          features?: Json | null
          id?: string
          included_modules: string[]
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_price: number
          name: string
          updated_at?: string | null
        }
        Update: {
          annual_price?: number | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          features?: Json | null
          id?: string
          included_modules?: string[]
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_price?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_intelligence_reports: {
        Row: {
          auto_generated: boolean | null
          created_at: string | null
          file_url: string | null
          generated_for_user_id: string | null
          id: string
          metadata: Json | null
          report_data: Json
          report_format: string | null
          report_name: string
          report_period_end: string
          report_period_start: string
          report_type: string
          share_settings: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_generated?: boolean | null
          created_at?: string | null
          file_url?: string | null
          generated_for_user_id?: string | null
          id?: string
          metadata?: Json | null
          report_data?: Json
          report_format?: string | null
          report_name: string
          report_period_end: string
          report_period_start: string
          report_type: string
          share_settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_generated?: boolean | null
          created_at?: string | null
          file_url?: string | null
          generated_for_user_id?: string | null
          id?: string
          metadata?: Json | null
          report_data?: Json
          report_format?: string | null
          report_name?: string
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          share_settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      catalog_revenue_sources: {
        Row: {
          annual_revenue: number
          catalog_valuation_id: string
          confidence_level: string | null
          created_at: string
          currency: string
          end_date: string | null
          growth_rate: number | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          revenue_source: string
          revenue_type: string
          start_date: string | null
          supporting_documents: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_revenue?: number
          catalog_valuation_id: string
          confidence_level?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          growth_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          revenue_source: string
          revenue_type: string
          start_date?: string | null
          supporting_documents?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_revenue?: number
          catalog_valuation_id?: string
          confidence_level?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          growth_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          revenue_source?: string
          revenue_type?: string
          start_date?: string | null
          supporting_documents?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_catalog_valuation"
            columns: ["catalog_valuation_id"]
            isOneToOne: false
            referencedRelation: "catalog_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_valuations: {
        Row: {
          artist_name: string
          blended_valuation: number | null
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
          has_additional_revenue: boolean | null
          id: string
          ltm_revenue: number | null
          monthly_listeners: number | null
          multiple_valuation: number | null
          popularity_score: number | null
          revenue_diversification_score: number | null
          risk_adjusted_value: number | null
          top_tracks: Json | null
          total_additional_revenue: number | null
          total_streams: number | null
          updated_at: string
          user_id: string
          valuation_amount: number | null
          valuation_methodology: string | null
          valuation_methodology_v2: string | null
        }
        Insert: {
          artist_name: string
          blended_valuation?: number | null
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
          has_additional_revenue?: boolean | null
          id?: string
          ltm_revenue?: number | null
          monthly_listeners?: number | null
          multiple_valuation?: number | null
          popularity_score?: number | null
          revenue_diversification_score?: number | null
          risk_adjusted_value?: number | null
          top_tracks?: Json | null
          total_additional_revenue?: number | null
          total_streams?: number | null
          updated_at?: string
          user_id: string
          valuation_amount?: number | null
          valuation_methodology?: string | null
          valuation_methodology_v2?: string | null
        }
        Update: {
          artist_name?: string
          blended_valuation?: number | null
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
          has_additional_revenue?: boolean | null
          id?: string
          ltm_revenue?: number | null
          monthly_listeners?: number | null
          multiple_valuation?: number | null
          popularity_score?: number | null
          revenue_diversification_score?: number | null
          risk_adjusted_value?: number | null
          top_tracks?: Json | null
          total_additional_revenue?: number | null
          total_streams?: number | null
          updated_at?: string
          user_id?: string
          valuation_amount?: number | null
          valuation_methodology?: string | null
          valuation_methodology_v2?: string | null
        }
        Relationships: []
      }
      client_account_balances: {
        Row: {
          client_id: string
          created_at: string
          current_balance: number
          id: string
          last_statement_date: string | null
          next_statement_due: string | null
          total_earned: number
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          current_balance?: number
          id?: string
          last_statement_date?: string | null
          next_statement_due?: string | null
          total_earned?: number
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          current_balance?: number
          id?: string
          last_statement_date?: string | null
          next_statement_due?: string | null
          total_earned?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_account_balances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_data_associations: {
        Row: {
          client_user_id: string
          created_at: string
          data_id: string
          data_type: string
          id: string
          subscriber_user_id: string
        }
        Insert: {
          client_user_id: string
          created_at?: string
          data_id: string
          data_type: string
          id?: string
          subscriber_user_id: string
        }
        Update: {
          client_user_id?: string
          created_at?: string
          data_id?: string
          data_type?: string
          id?: string
          subscriber_user_id?: string
        }
        Relationships: []
      }
      client_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          auto_cleanup_scheduled_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          permissions: Json
          reminder_count: number | null
          reminder_sent_at: string | null
          role: Database["public"]["Enums"]["client_role"]
          status: string
          subscriber_user_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          auto_cleanup_scheduled_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          permissions?: Json
          reminder_count?: number | null
          reminder_sent_at?: string | null
          role?: Database["public"]["Enums"]["client_role"]
          status?: string
          subscriber_user_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          auto_cleanup_scheduled_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          permissions?: Json
          reminder_count?: number | null
          reminder_sent_at?: string | null
          role?: Database["public"]["Enums"]["client_role"]
          status?: string
          subscriber_user_id?: string
        }
        Relationships: []
      }
      client_portal_access: {
        Row: {
          client_user_id: string
          created_at: string
          expires_at: string | null
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["client_role"]
          status: string
          subscriber_user_id: string
          updated_at: string
        }
        Insert: {
          client_user_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["client_role"]
          status?: string
          subscriber_user_id: string
          updated_at?: string
        }
        Update: {
          client_user_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["client_role"]
          status?: string
          subscriber_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cohort_analysis: {
        Row: {
          calculated_metrics: Json
          calculation_date: string
          churn_data: Json
          cohort_name: string
          cohort_period: string
          cohort_type: string
          created_at: string | null
          customer_count: number
          id: string
          is_active: boolean | null
          metadata: Json | null
          retention_data: Json
          revenue_data: Json
          updated_at: string | null
        }
        Insert: {
          calculated_metrics?: Json
          calculation_date?: string
          churn_data?: Json
          cohort_name: string
          cohort_period: string
          cohort_type: string
          created_at?: string | null
          customer_count?: number
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          retention_data?: Json
          revenue_data?: Json
          updated_at?: string | null
        }
        Update: {
          calculated_metrics?: Json
          calculation_date?: string
          churn_data?: Json
          cohort_name?: string
          cohort_period?: string
          cohort_type?: string
          created_at?: string | null
          customer_count?: number
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          retention_data?: Json
          revenue_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: Json | null
          billing_info: Json | null
          contact_email: string | null
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          logo_url: string | null
          module_access: Json | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          billing_info?: Json | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          logo_url?: string | null
          module_access?: Json | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          billing_info?: Json | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          logo_url?: string | null
          module_access?: Json | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_module_access: {
        Row: {
          access_source: string
          company_id: string
          created_at: string
          expires_at: string | null
          granted_at: string | null
          id: string
          module_id: string
          settings: Json | null
        }
        Insert: {
          access_source?: string
          company_id: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          module_id: string
          settings?: Json | null
        }
        Update: {
          access_source?: string
          company_id?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          module_id?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_module_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          contact_type: string
          created_at: string
          email: string | null
          id: string
          name: string
          payment_info: Json | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          payment_info?: Json | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          payment_info?: Json | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_change_logs: {
        Row: {
          change_type: string
          contract_id: string
          created_at: string
          description: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          change_type: string
          contract_id: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          contract_id?: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_change_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_interested_parties: {
        Row: {
          address: string | null
          administrator_role: string | null
          affiliation: string | null
          cae_number: string | null
          co_publisher: string | null
          contract_id: string
          controlled_status: string
          created_at: string
          dba_alias: string | null
          email: string | null
          grand_rights_percentage: number | null
          id: string
          ipi_number: string | null
          karaoke_percentage: number | null
          mechanical_percentage: number | null
          name: string
          original_publisher: string | null
          party_type: string
          performance_percentage: number | null
          phone: string | null
          print_percentage: number | null
          synch_percentage: number | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          administrator_role?: string | null
          affiliation?: string | null
          cae_number?: string | null
          co_publisher?: string | null
          contract_id: string
          controlled_status?: string
          created_at?: string
          dba_alias?: string | null
          email?: string | null
          grand_rights_percentage?: number | null
          id?: string
          ipi_number?: string | null
          karaoke_percentage?: number | null
          mechanical_percentage?: number | null
          name: string
          original_publisher?: string | null
          party_type?: string
          performance_percentage?: number | null
          phone?: string | null
          print_percentage?: number | null
          synch_percentage?: number | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          administrator_role?: string | null
          affiliation?: string | null
          cae_number?: string | null
          co_publisher?: string | null
          contract_id?: string
          controlled_status?: string
          created_at?: string
          dba_alias?: string | null
          email?: string | null
          grand_rights_percentage?: number | null
          id?: string
          ipi_number?: string | null
          karaoke_percentage?: number | null
          mechanical_percentage?: number | null
          name?: string
          original_publisher?: string | null
          party_type?: string
          performance_percentage?: number | null
          phone?: string | null
          print_percentage?: number | null
          synch_percentage?: number | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_interested_parties_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_parsing_results: {
        Row: {
          contract_id: string | null
          created_at: string
          error_message: string | null
          extracted_entities: Json | null
          id: string
          original_text: string | null
          parsed_data: Json
          parsing_confidence: number | null
          parsing_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          error_message?: string | null
          extracted_entities?: Json | null
          id?: string
          original_text?: string | null
          parsed_data?: Json
          parsing_confidence?: number | null
          parsing_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          error_message?: string | null
          extracted_entities?: Json | null
          id?: string
          original_text?: string | null
          parsed_data?: Json
          parsing_confidence?: number | null
          parsing_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_parsing_results_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_royalty_connections: {
        Row: {
          catalog_id: string | null
          contract_id: string
          created_at: string
          id: string
          payment_priority: number | null
          recipient_name: string
          recipient_type: string
          recoupment_applicable: boolean | null
          royalty_type: string
          split_percentage: number
        }
        Insert: {
          catalog_id?: string | null
          contract_id: string
          created_at?: string
          id?: string
          payment_priority?: number | null
          recipient_name: string
          recipient_type: string
          recoupment_applicable?: boolean | null
          royalty_type: string
          split_percentage: number
        }
        Update: {
          catalog_id?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          payment_priority?: number | null
          recipient_name?: string
          recipient_type?: string
          recoupment_applicable?: boolean | null
          royalty_type?: string
          split_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_royalty_connections_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_schedule_works: {
        Row: {
          album_title: string | null
          artist_name: string | null
          contract_id: string
          copyright_id: string | null
          created_at: string
          id: string
          inherits_controlled_status: boolean | null
          inherits_recoupment_status: boolean | null
          inherits_royalty_splits: boolean | null
          isrc: string | null
          iswc: string | null
          song_title: string
          updated_at: string
          work_id: string | null
          work_specific_advance: number | null
          work_specific_rate_reduction: number | null
        }
        Insert: {
          album_title?: string | null
          artist_name?: string | null
          contract_id: string
          copyright_id?: string | null
          created_at?: string
          id?: string
          inherits_controlled_status?: boolean | null
          inherits_recoupment_status?: boolean | null
          inherits_royalty_splits?: boolean | null
          isrc?: string | null
          iswc?: string | null
          song_title: string
          updated_at?: string
          work_id?: string | null
          work_specific_advance?: number | null
          work_specific_rate_reduction?: number | null
        }
        Update: {
          album_title?: string | null
          artist_name?: string | null
          contract_id?: string
          copyright_id?: string | null
          created_at?: string
          id?: string
          inherits_controlled_status?: boolean | null
          inherits_recoupment_status?: boolean | null
          inherits_royalty_splits?: boolean | null
          isrc?: string | null
          iswc?: string | null
          song_title?: string
          updated_at?: string
          work_id?: string | null
          work_specific_advance?: number | null
          work_specific_rate_reduction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_schedule_works_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_schedule_works_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          id: string
          is_public: boolean | null
          template_data: Json
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          id?: string
          is_public?: boolean | null
          template_data?: Json
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          id?: string
          is_public?: boolean | null
          template_data?: Json
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          administrator: string | null
          advance_amount: number | null
          agreement_id: string | null
          associated_catalog_ids: string[] | null
          commission_percentage: number | null
          contact_address: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_data: Json | null
          contract_status: Database["public"]["Enums"]["contract_status"]
          contract_type: Database["public"]["Enums"]["contract_type"]
          controlled_percentage: number | null
          counterparty_name: string
          created_at: string
          direct_deposit_auth_url: string | null
          distribution_cycle: string | null
          end_date: string | null
          fe_agreement_url: string | null
          financial_terms: Json | null
          generated_pdf_url: string | null
          id: string
          last_sent_date: string | null
          notes: string | null
          original_pdf_url: string | null
          original_publisher: string | null
          rate_reduction_amount: number | null
          rate_reduction_percentage: number | null
          recipient_email: string | null
          recoupment_status: string | null
          royalty_splits: Json | null
          signature_status: string | null
          start_date: string | null
          statement_delivery: string | null
          template_id: string | null
          territories: string[] | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
          w9_url: string | null
        }
        Insert: {
          administrator?: string | null
          advance_amount?: number | null
          agreement_id?: string | null
          associated_catalog_ids?: string[] | null
          commission_percentage?: number | null
          contact_address?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_data?: Json | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          contract_type: Database["public"]["Enums"]["contract_type"]
          controlled_percentage?: number | null
          counterparty_name: string
          created_at?: string
          direct_deposit_auth_url?: string | null
          distribution_cycle?: string | null
          end_date?: string | null
          fe_agreement_url?: string | null
          financial_terms?: Json | null
          generated_pdf_url?: string | null
          id?: string
          last_sent_date?: string | null
          notes?: string | null
          original_pdf_url?: string | null
          original_publisher?: string | null
          rate_reduction_amount?: number | null
          rate_reduction_percentage?: number | null
          recipient_email?: string | null
          recoupment_status?: string | null
          royalty_splits?: Json | null
          signature_status?: string | null
          start_date?: string | null
          statement_delivery?: string | null
          template_id?: string | null
          territories?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
          w9_url?: string | null
        }
        Update: {
          administrator?: string | null
          advance_amount?: number | null
          agreement_id?: string | null
          associated_catalog_ids?: string[] | null
          commission_percentage?: number | null
          contact_address?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_data?: Json | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          contract_type?: Database["public"]["Enums"]["contract_type"]
          controlled_percentage?: number | null
          counterparty_name?: string
          created_at?: string
          direct_deposit_auth_url?: string | null
          distribution_cycle?: string | null
          end_date?: string | null
          fe_agreement_url?: string | null
          financial_terms?: Json | null
          generated_pdf_url?: string | null
          id?: string
          last_sent_date?: string | null
          notes?: string | null
          original_pdf_url?: string | null
          original_publisher?: string | null
          rate_reduction_amount?: number | null
          rate_reduction_percentage?: number | null
          recipient_email?: string | null
          recoupment_status?: string | null
          royalty_splits?: Json | null
          signature_status?: string | null
          start_date?: string | null
          statement_delivery?: string | null
          template_id?: string | null
          territories?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
          w9_url?: string | null
        }
        Relationships: []
      }
      copyright_activity_logs: {
        Row: {
          action_type: string
          affected_fields: string[] | null
          batch_id: string | null
          copyright_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          operation_details: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          affected_fields?: string[] | null
          batch_id?: string | null
          copyright_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation_details?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          affected_fields?: string[] | null
          batch_id?: string | null
          copyright_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation_details?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copyright_activity_logs_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_exports: {
        Row: {
          batch_name: string | null
          copyright_id: string | null
          created_at: string
          delivery_job_id: string | null
          error_message: string | null
          export_format: string
          export_notes: string | null
          export_status: string | null
          export_tags: string[] | null
          export_type: string | null
          export_version: number | null
          file_size_bytes: number | null
          file_storage_path: string | null
          file_url: string | null
          id: string
          parent_export_id: string | null
          readiness_issues: Json | null
          record_count: number | null
          user_id: string
          validation_score: number | null
        }
        Insert: {
          batch_name?: string | null
          copyright_id?: string | null
          created_at?: string
          delivery_job_id?: string | null
          error_message?: string | null
          export_format: string
          export_notes?: string | null
          export_status?: string | null
          export_tags?: string[] | null
          export_type?: string | null
          export_version?: number | null
          file_size_bytes?: number | null
          file_storage_path?: string | null
          file_url?: string | null
          id?: string
          parent_export_id?: string | null
          readiness_issues?: Json | null
          record_count?: number | null
          user_id: string
          validation_score?: number | null
        }
        Update: {
          batch_name?: string | null
          copyright_id?: string | null
          created_at?: string
          delivery_job_id?: string | null
          error_message?: string | null
          export_format?: string
          export_notes?: string | null
          export_status?: string | null
          export_tags?: string[] | null
          export_type?: string | null
          export_version?: number | null
          file_size_bytes?: number | null
          file_storage_path?: string | null
          file_url?: string | null
          id?: string
          parent_export_id?: string | null
          readiness_issues?: Json | null
          record_count?: number | null
          user_id?: string
          validation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "copyright_exports_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copyright_exports_delivery_job_id_fkey"
            columns: ["delivery_job_id"]
            isOneToOne: false
            referencedRelation: "export_delivery_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copyright_exports_parent_export_id_fkey"
            columns: ["parent_export_id"]
            isOneToOne: false
            referencedRelation: "copyright_exports"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_publishers: {
        Row: {
          agreement_end_date: string | null
          agreement_start_date: string | null
          agreement_type: string | null
          cae_number: string | null
          copyright_id: string
          created_at: string
          id: string
          ipi_number: string | null
          isni: string | null
          mechanical_share: number | null
          ownership_percentage: number
          performance_share: number | null
          pro_affiliation: string | null
          publisher_name: string
          publisher_role: string | null
          synchronization_share: number | null
          territory: string | null
        }
        Insert: {
          agreement_end_date?: string | null
          agreement_start_date?: string | null
          agreement_type?: string | null
          cae_number?: string | null
          copyright_id: string
          created_at?: string
          id?: string
          ipi_number?: string | null
          isni?: string | null
          mechanical_share?: number | null
          ownership_percentage: number
          performance_share?: number | null
          pro_affiliation?: string | null
          publisher_name: string
          publisher_role?: string | null
          synchronization_share?: number | null
          territory?: string | null
        }
        Update: {
          agreement_end_date?: string | null
          agreement_start_date?: string | null
          agreement_type?: string | null
          cae_number?: string | null
          copyright_id?: string
          created_at?: string
          id?: string
          ipi_number?: string | null
          isni?: string | null
          mechanical_share?: number | null
          ownership_percentage?: number
          performance_share?: number | null
          pro_affiliation?: string | null
          publisher_name?: string
          publisher_role?: string | null
          synchronization_share?: number | null
          territory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copyright_publishers_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_recordings: {
        Row: {
          artist_name: string | null
          copyright_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          isrc: string | null
          label_name: string | null
          recording_title: string | null
          recording_version: string | null
          release_date: string | null
        }
        Insert: {
          artist_name?: string | null
          copyright_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          isrc?: string | null
          label_name?: string | null
          recording_title?: string | null
          recording_version?: string | null
          release_date?: string | null
        }
        Update: {
          artist_name?: string | null
          copyright_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          isrc?: string | null
          label_name?: string | null
          recording_title?: string | null
          recording_version?: string | null
          release_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copyright_recordings_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_writers: {
        Row: {
          cae_number: string | null
          controlled_status: string | null
          copyright_id: string
          created_at: string
          id: string
          ipi_number: string | null
          isni: string | null
          mechanical_share: number | null
          nationality: string | null
          ownership_percentage: number
          performance_share: number | null
          pro_affiliation: string | null
          synchronization_share: number | null
          writer_name: string
          writer_role: string | null
        }
        Insert: {
          cae_number?: string | null
          controlled_status?: string | null
          copyright_id: string
          created_at?: string
          id?: string
          ipi_number?: string | null
          isni?: string | null
          mechanical_share?: number | null
          nationality?: string | null
          ownership_percentage: number
          performance_share?: number | null
          pro_affiliation?: string | null
          synchronization_share?: number | null
          writer_name: string
          writer_role?: string | null
        }
        Update: {
          cae_number?: string | null
          controlled_status?: string | null
          copyright_id?: string
          created_at?: string
          id?: string
          ipi_number?: string | null
          isni?: string | null
          mechanical_share?: number | null
          nationality?: string | null
          ownership_percentage?: number
          performance_share?: number | null
          pro_affiliation?: string | null
          synchronization_share?: number | null
          writer_name?: string
          writer_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copyright_writers_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      copyrights: {
        Row: {
          akas: string[] | null
          album_title: string | null
          ascap_status: string | null
          ascap_work_id: string | null
          bmi_status: string | null
          bmi_work_id: string | null
          catalogue_number: string | null
          collection_territories: string[] | null
          contains_sample: boolean | null
          copyright_date: string | null
          copyright_reg_number: string | null
          created_at: string
          creation_date: string | null
          date_submitted: string | null
          duration_seconds: number | null
          id: string
          internal_id: string | null
          iswc: string | null
          language_code: string | null
          masters_ownership: string | null
          mlc_status: string | null
          mlc_work_id: string | null
          mp3_link: string | null
          notes: string | null
          notice_date: string | null
          opus_number: string | null
          registration_status: string | null
          registration_type: string | null
          rights_types: string[] | null
          sesac_status: string | null
          sesac_work_id: string | null
          socan_status: string | null
          socan_work_id: string | null
          sound_recording_certificate_url: string | null
          status: string | null
          submission_date: string | null
          supports_cwr: boolean | null
          supports_ddex: boolean | null
          updated_at: string
          user_id: string
          validation_errors: Json | null
          validation_status: Json | null
          work_classification: string | null
          work_id: string | null
          work_title: string
          work_type: string | null
        }
        Insert: {
          akas?: string[] | null
          album_title?: string | null
          ascap_status?: string | null
          ascap_work_id?: string | null
          bmi_status?: string | null
          bmi_work_id?: string | null
          catalogue_number?: string | null
          collection_territories?: string[] | null
          contains_sample?: boolean | null
          copyright_date?: string | null
          copyright_reg_number?: string | null
          created_at?: string
          creation_date?: string | null
          date_submitted?: string | null
          duration_seconds?: number | null
          id?: string
          internal_id?: string | null
          iswc?: string | null
          language_code?: string | null
          masters_ownership?: string | null
          mlc_status?: string | null
          mlc_work_id?: string | null
          mp3_link?: string | null
          notes?: string | null
          notice_date?: string | null
          opus_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          rights_types?: string[] | null
          sesac_status?: string | null
          sesac_work_id?: string | null
          socan_status?: string | null
          socan_work_id?: string | null
          sound_recording_certificate_url?: string | null
          status?: string | null
          submission_date?: string | null
          supports_cwr?: boolean | null
          supports_ddex?: boolean | null
          updated_at?: string
          user_id: string
          validation_errors?: Json | null
          validation_status?: Json | null
          work_classification?: string | null
          work_id?: string | null
          work_title: string
          work_type?: string | null
        }
        Update: {
          akas?: string[] | null
          album_title?: string | null
          ascap_status?: string | null
          ascap_work_id?: string | null
          bmi_status?: string | null
          bmi_work_id?: string | null
          catalogue_number?: string | null
          collection_territories?: string[] | null
          contains_sample?: boolean | null
          copyright_date?: string | null
          copyright_reg_number?: string | null
          created_at?: string
          creation_date?: string | null
          date_submitted?: string | null
          duration_seconds?: number | null
          id?: string
          internal_id?: string | null
          iswc?: string | null
          language_code?: string | null
          masters_ownership?: string | null
          mlc_status?: string | null
          mlc_work_id?: string | null
          mp3_link?: string | null
          notes?: string | null
          notice_date?: string | null
          opus_number?: string | null
          registration_status?: string | null
          registration_type?: string | null
          rights_types?: string[] | null
          sesac_status?: string | null
          sesac_work_id?: string | null
          socan_status?: string | null
          socan_work_id?: string | null
          sound_recording_certificate_url?: string | null
          status?: string | null
          submission_date?: string | null
          supports_cwr?: boolean | null
          supports_ddex?: boolean | null
          updated_at?: string
          user_id?: string
          validation_errors?: Json | null
          validation_status?: Json | null
          work_classification?: string | null
          work_id?: string | null
          work_title?: string
          work_type?: string | null
        }
        Relationships: []
      }
      customer_health_metrics: {
        Row: {
          contracts_created: number | null
          created_at: string | null
          customer_user_id: string
          days_since_signup: number | null
          feature_adoption_rate: number | null
          health_score: number | null
          id: string
          last_activity_date: string | null
          login_frequency: number | null
          modules_used: string[] | null
          risk_level: string | null
          royalties_processed: number | null
          subscription_status: string | null
          support_tickets_count: number | null
          updated_at: string | null
        }
        Insert: {
          contracts_created?: number | null
          created_at?: string | null
          customer_user_id: string
          days_since_signup?: number | null
          feature_adoption_rate?: number | null
          health_score?: number | null
          id?: string
          last_activity_date?: string | null
          login_frequency?: number | null
          modules_used?: string[] | null
          risk_level?: string | null
          royalties_processed?: number | null
          subscription_status?: string | null
          support_tickets_count?: number | null
          updated_at?: string | null
        }
        Update: {
          contracts_created?: number | null
          created_at?: string | null
          customer_user_id?: string
          days_since_signup?: number | null
          feature_adoption_rate?: number | null
          health_score?: number | null
          id?: string
          last_activity_date?: string | null
          login_frequency?: number | null
          modules_used?: string[] | null
          risk_level?: string | null
          royalties_processed?: number | null
          subscription_status?: string | null
          support_tickets_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_journey_events: {
        Row: {
          automated_trigger: boolean | null
          created_at: string | null
          customer_user_id: string
          event_category: string
          event_details: Json
          event_type: string
          id: string
          impact_score: number | null
          journey_stage: string
          metadata: Json | null
          processed_by_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          automated_trigger?: boolean | null
          created_at?: string | null
          customer_user_id: string
          event_category: string
          event_details?: Json
          event_type: string
          id?: string
          impact_score?: number | null
          journey_stage: string
          metadata?: Json | null
          processed_by_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          automated_trigger?: boolean | null
          created_at?: string | null
          customer_user_id?: string
          event_category?: string
          event_details?: Json
          event_type?: string
          id?: string
          impact_score?: number | null
          journey_stage?: string
          metadata?: Json | null
          processed_by_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_touchpoints: {
        Row: {
          channel: string
          content: string | null
          created_at: string | null
          customer_user_id: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          handled_by_user_id: string | null
          id: string
          interaction_direction: string
          metadata: Json | null
          outcome: string | null
          subject: string
          touchpoint_type: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          content?: string | null
          created_at?: string | null
          customer_user_id: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          handled_by_user_id?: string | null
          id?: string
          interaction_direction: string
          metadata?: Json | null
          outcome?: string | null
          subject: string
          touchpoint_type: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          content?: string | null
          created_at?: string | null
          customer_user_id?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          handled_by_user_id?: string | null
          id?: string
          interaction_direction?: string
          metadata?: Json | null
          outcome?: string | null
          subject?: string
          touchpoint_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cwr_acknowledgments: {
        Row: {
          ack_file_name: string | null
          ack_file_url: string | null
          created_at: string
          id: string
          linked_records: Json | null
          parsed_data: Json | null
          received_at: string
          registration_status: string
          response_code: string | null
          response_message: string | null
          submission_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ack_file_name?: string | null
          ack_file_url?: string | null
          created_at?: string
          id?: string
          linked_records?: Json | null
          parsed_data?: Json | null
          received_at?: string
          registration_status?: string
          response_code?: string | null
          response_message?: string | null
          submission_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ack_file_name?: string | null
          ack_file_url?: string | null
          created_at?: string
          id?: string
          linked_records?: Json | null
          parsed_data?: Json | null
          received_at?: string
          registration_status?: string
          response_code?: string | null
          response_message?: string | null
          submission_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cwr_acknowledgments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "cwr_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      cwr_sender_code_requests: {
        Row: {
          created_at: string
          id: string
          pro_type: Database["public"]["Enums"]["pro_type"]
          request_content: string
          request_sent_at: string
          response_notes: string | null
          response_received_at: string | null
          sender_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pro_type: Database["public"]["Enums"]["pro_type"]
          request_content: string
          request_sent_at?: string
          response_notes?: string | null
          response_received_at?: string | null
          sender_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pro_type?: Database["public"]["Enums"]["pro_type"]
          request_content?: string
          request_sent_at?: string
          response_notes?: string | null
          response_received_at?: string | null
          sender_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cwr_sender_code_requests_sender_code_id_fkey"
            columns: ["sender_code_id"]
            isOneToOne: false
            referencedRelation: "cwr_sender_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      cwr_sender_codes: {
        Row: {
          company_name: string
          contact_email: string
          created_at: string
          encrypted_sender_code: string
          id: string
          ipi_cae_number: string | null
          notes: string | null
          sender_code: string
          status: Database["public"]["Enums"]["sender_code_status"]
          status_updated_at: string | null
          status_updated_by: string | null
          supporting_document_url: string | null
          target_pros: Database["public"]["Enums"]["pro_type"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          contact_email: string
          created_at?: string
          encrypted_sender_code: string
          id?: string
          ipi_cae_number?: string | null
          notes?: string | null
          sender_code: string
          status?: Database["public"]["Enums"]["sender_code_status"]
          status_updated_at?: string | null
          status_updated_by?: string | null
          supporting_document_url?: string | null
          target_pros?: Database["public"]["Enums"]["pro_type"][]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          created_at?: string
          encrypted_sender_code?: string
          id?: string
          ipi_cae_number?: string | null
          notes?: string | null
          sender_code?: string
          status?: Database["public"]["Enums"]["sender_code_status"]
          status_updated_at?: string | null
          status_updated_by?: string | null
          supporting_document_url?: string | null
          target_pros?: Database["public"]["Enums"]["pro_type"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cwr_submissions: {
        Row: {
          copyright_id: string | null
          created_at: string
          cwr_file_name: string | null
          cwr_file_url: string | null
          id: string
          iswc: string | null
          pro_name: string
          sender_code: string
          submission_date: string
          submission_status: string
          submitted_by: string
          updated_at: string
          user_id: string
          work_title: string
        }
        Insert: {
          copyright_id?: string | null
          created_at?: string
          cwr_file_name?: string | null
          cwr_file_url?: string | null
          id?: string
          iswc?: string | null
          pro_name: string
          sender_code: string
          submission_date?: string
          submission_status?: string
          submitted_by: string
          updated_at?: string
          user_id: string
          work_title: string
        }
        Update: {
          copyright_id?: string | null
          created_at?: string
          cwr_file_name?: string | null
          cwr_file_url?: string | null
          id?: string
          iswc?: string | null
          pro_name?: string
          sender_code?: string
          submission_date?: string
          submission_status?: string
          submitted_by?: string
          updated_at?: string
          user_id?: string
          work_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cwr_submissions_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_historical_statements: {
        Row: {
          artist_id: string | null
          artist_name: string
          catalog_name: string | null
          created_at: string
          expenses: number | null
          file_url: string | null
          gross_revenue: number
          id: string
          mechanical_royalties: number | null
          net_revenue: number
          notes: string | null
          other_revenue: number | null
          performance_royalties: number | null
          period_label: string
          quarter: number
          revenue_sources: Json | null
          source_detected: string | null
          statement_type: string
          streaming_revenue: number | null
          streams: number | null
          sync_revenue: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          artist_id?: string | null
          artist_name: string
          catalog_name?: string | null
          created_at?: string
          expenses?: number | null
          file_url?: string | null
          gross_revenue?: number
          id?: string
          mechanical_royalties?: number | null
          net_revenue?: number
          notes?: string | null
          other_revenue?: number | null
          performance_royalties?: number | null
          period_label: string
          quarter: number
          revenue_sources?: Json | null
          source_detected?: string | null
          statement_type: string
          streaming_revenue?: number | null
          streams?: number | null
          sync_revenue?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          artist_id?: string | null
          artist_name?: string
          catalog_name?: string | null
          created_at?: string
          expenses?: number | null
          file_url?: string | null
          gross_revenue?: number
          id?: string
          mechanical_royalties?: number | null
          net_revenue?: number
          notes?: string | null
          other_revenue?: number | null
          performance_royalties?: number | null
          period_label?: string
          quarter?: number
          revenue_sources?: Json | null
          source_detected?: string | null
          statement_type?: string
          streaming_revenue?: number | null
          streams?: number | null
          sync_revenue?: number | null
          updated_at?: string
          user_id?: string
          year?: number
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
      export_delivery_jobs: {
        Row: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string
          delivery_metadata: Json | null
          delivery_status: string
          error_message: string | null
          export_id: string
          file_path: string
          ftp_credential_id: string
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string
          delivery_metadata?: Json | null
          delivery_status?: string
          error_message?: string | null
          export_id: string
          file_path: string
          ftp_credential_id: string
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string
          delivery_metadata?: Json | null
          delivery_status?: string
          error_message?: string | null
          export_id?: string
          file_path?: string
          ftp_credential_id?: string
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_delivery_jobs_ftp_credential_id_fkey"
            columns: ["ftp_credential_id"]
            isOneToOne: false
            referencedRelation: "pro_ftp_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      export_validation_results: {
        Row: {
          blocking_issues: Json | null
          can_export: boolean | null
          copyright_ids: string[]
          created_at: string
          id: string
          overall_score: number | null
          user_id: string
          validated_at: string
          validation_results: Json
          validation_type: string
          warning_issues: Json | null
        }
        Insert: {
          blocking_issues?: Json | null
          can_export?: boolean | null
          copyright_ids: string[]
          created_at?: string
          id?: string
          overall_score?: number | null
          user_id: string
          validated_at?: string
          validation_results?: Json
          validation_type: string
          warning_issues?: Json | null
        }
        Update: {
          blocking_issues?: Json | null
          can_export?: boolean | null
          copyright_ids?: string[]
          created_at?: string
          id?: string
          overall_score?: number | null
          user_id?: string
          validated_at?: string
          validation_results?: Json
          validation_type?: string
          warning_issues?: Json | null
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
      integration_management: {
        Row: {
          configuration: Json
          connection_status: string
          created_at: string
          error_count: number | null
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean
          last_sync_at: string | null
          success_count: number | null
          sync_frequency_hours: number | null
          updated_at: string
        }
        Insert: {
          configuration?: Json
          connection_status?: string
          created_at?: string
          error_count?: number | null
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean
          last_sync_at?: string | null
          success_count?: number | null
          sync_frequency_hours?: number | null
          updated_at?: string
        }
        Update: {
          configuration?: Json
          connection_status?: string
          created_at?: string
          error_count?: number | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean
          last_sync_at?: string | null
          success_count?: number | null
          sync_frequency_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          template_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_products: {
        Row: {
          annual_price: number | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          module_id: string
          monthly_price: number
          name: string
          updated_at: string | null
        }
        Insert: {
          annual_price?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          module_id: string
          monthly_price: number
          name: string
          updated_at?: string | null
        }
        Update: {
          annual_price?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          monthly_price?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          enabled: boolean
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          enabled?: boolean
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          enabled?: boolean
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          priority: Database["public"]["Enums"]["notification_priority"]
          read: boolean
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: Database["public"]["Enums"]["notification_priority"]
          read?: boolean
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_emails: {
        Row: {
          clicked_at: string | null
          delivery_status: string | null
          email_data: Json | null
          email_status: string
          email_subject: string | null
          email_type: string
          error_message: string | null
          id: string
          module_id: string
          opened_at: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          delivery_status?: string | null
          email_data?: Json | null
          email_status?: string
          email_subject?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          module_id: string
          opened_at?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          delivery_status?: string | null
          email_data?: Json | null
          email_status?: string
          email_subject?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          module_id?: string
          opened_at?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operations_team_members: {
        Row: {
          active_tickets_count: number | null
          avg_resolution_time_hours: number | null
          contact_info: Json | null
          created_at: string | null
          department: string
          department_level: number | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          is_team_lead: boolean | null
          last_performance_review: string | null
          performance_score: number | null
          permissions: Json | null
          resolved_tickets_count: number | null
          role_title: string
          status: string | null
          team_member_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_tickets_count?: number | null
          avg_resolution_time_hours?: number | null
          contact_info?: Json | null
          created_at?: string | null
          department: string
          department_level?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_team_lead?: boolean | null
          last_performance_review?: string | null
          performance_score?: number | null
          permissions?: Json | null
          resolved_tickets_count?: number | null
          role_title: string
          status?: string | null
          team_member_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_tickets_count?: number | null
          avg_resolution_time_hours?: number | null
          contact_info?: Json | null
          created_at?: string | null
          department?: string
          department_level?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_team_lead?: boolean | null
          last_performance_review?: string | null
          performance_score?: number | null
          permissions?: Json | null
          resolved_tickets_count?: number | null
          role_title?: string
          status?: string | null
          team_member_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      original_publishers: {
        Row: {
          agreement_id: string
          contact_info: Json | null
          created_at: string
          id: string
          op_id: string
          publisher_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agreement_id: string
          contact_info?: Json | null
          created_at?: string
          id?: string
          op_id: string
          publisher_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agreement_id?: string
          contact_info?: Json | null
          created_at?: string
          id?: string
          op_id?: string
          publisher_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_original_publishers_agreement"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      payees: {
        Row: {
          contact_info: Json | null
          created_at: string
          id: string
          is_primary: boolean | null
          payee_id: string | null
          payee_name: string
          payee_type: string
          payment_info: Json | null
          updated_at: string
          user_id: string
          writer_id: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          payee_id?: string | null
          payee_name: string
          payee_type: string
          payment_info?: Json | null
          updated_at?: string
          user_id: string
          writer_id: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          payee_id?: string | null
          payee_name?: string
          payee_type?: string
          payment_info?: Json | null
          updated_at?: string
          user_id?: string
          writer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payees_writer"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "writers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_integration_settings: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean | null
          is_default: boolean | null
          limits: Json | null
          processing_fees: Json | null
          supported_currencies: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean | null
          is_default?: boolean | null
          limits?: Json | null
          processing_fees?: Json | null
          supported_currencies?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean | null
          is_default?: boolean | null
          limits?: Json | null
          processing_fees?: Json | null
          supported_currencies?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_processing_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          payout_id: string
          processing_status: string | null
          processor_config: Json | null
          processor_type: string
          retry_count: number | null
          scheduled_for: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payout_id: string
          processing_status?: string | null
          processor_config?: Json | null
          processor_type: string
          retry_count?: number | null
          scheduled_for?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payout_id?: string
          processing_status?: string | null
          processor_config?: Json | null
          processor_type?: string
          retry_count?: number | null
          scheduled_for?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_processing_queue_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_batch_operations: {
        Row: {
          created_at: string | null
          error_details: Json | null
          failed_count: number | null
          id: string
          operation_config: Json | null
          operation_status: string | null
          operation_type: string
          payout_ids: string[]
          processed_count: number | null
          results: Json | null
          total_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          operation_config?: Json | null
          operation_status?: string | null
          operation_type: string
          payout_ids: string[]
          processed_count?: number | null
          results?: Json | null
          total_count: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          operation_config?: Json | null
          operation_status?: string | null
          operation_type?: string
          payout_ids?: string[]
          processed_count?: number | null
          results?: Json | null
          total_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payout_expenses: {
        Row: {
          agreement_id: string | null
          amount: number
          created_at: string
          date_incurred: string | null
          description: string
          expense_behavior: string | null
          expense_cap: number | null
          expense_flags: Json | null
          expense_status: string | null
          expense_type: string
          id: string
          invoice_url: string | null
          is_commission_fee: boolean | null
          is_finder_fee: boolean | null
          is_percentage: boolean | null
          is_recoupable: boolean | null
          payee_id: string | null
          payout_id: string | null
          percentage_rate: number | null
          updated_at: string
          user_id: string
          valid_from_date: string | null
          valid_to_date: string | null
          work_id: string | null
        }
        Insert: {
          agreement_id?: string | null
          amount?: number
          created_at?: string
          date_incurred?: string | null
          description: string
          expense_behavior?: string | null
          expense_cap?: number | null
          expense_flags?: Json | null
          expense_status?: string | null
          expense_type: string
          id?: string
          invoice_url?: string | null
          is_commission_fee?: boolean | null
          is_finder_fee?: boolean | null
          is_percentage?: boolean | null
          is_recoupable?: boolean | null
          payee_id?: string | null
          payout_id?: string | null
          percentage_rate?: number | null
          updated_at?: string
          user_id: string
          valid_from_date?: string | null
          valid_to_date?: string | null
          work_id?: string | null
        }
        Update: {
          agreement_id?: string | null
          amount?: number
          created_at?: string
          date_incurred?: string | null
          description?: string
          expense_behavior?: string | null
          expense_cap?: number | null
          expense_flags?: Json | null
          expense_status?: string | null
          expense_type?: string
          id?: string
          invoice_url?: string | null
          is_commission_fee?: boolean | null
          is_finder_fee?: boolean | null
          is_percentage?: boolean | null
          is_recoupable?: boolean | null
          payee_id?: string | null
          payout_id?: string | null
          percentage_rate?: number | null
          updated_at?: string
          user_id?: string
          valid_from_date?: string | null
          valid_to_date?: string | null
          work_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_expenses_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_expenses_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_expenses_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_expenses_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_royalties: {
        Row: {
          allocated_amount: number
          created_at: string
          id: string
          payout_id: string
          royalty_id: string
        }
        Insert: {
          allocated_amount?: number
          created_at?: string
          id?: string
          payout_id: string
          royalty_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          id?: string
          payout_id?: string
          royalty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_royalties_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_royalties_royalty_id_fkey"
            columns: ["royalty_id"]
            isOneToOne: false
            referencedRelation: "royalty_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_workflow_history: {
        Row: {
          created_at: string | null
          from_stage: string | null
          id: string
          metadata: Json | null
          payout_id: string
          reason: string | null
          to_stage: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_stage?: string | null
          id?: string
          metadata?: Json | null
          payout_id: string
          reason?: string | null
          to_stage: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_stage?: string | null
          id?: string
          metadata?: Json | null
          payout_id?: string
          reason?: string | null
          to_stage?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_workflow_history_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          admin_fee_amount: number | null
          admin_fee_percentage: number | null
          amount_due: number
          approval_status: string | null
          approved_at: string | null
          approved_by_user_id: string | null
          auto_payment_enabled: boolean | null
          client_id: string
          commissions_amount: number | null
          created_at: string
          failure_reason: string | null
          gross_royalties: number
          id: string
          net_payable: number
          net_royalties: number | null
          notes: string | null
          payment_completed_at: string | null
          payment_date: string | null
          payment_failed_at: string | null
          payment_initiated_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_processor: string | null
          payment_processor_reference: string | null
          payment_reference: string | null
          payments_to_date: number
          period: string
          period_end: string | null
          period_start: string | null
          priority_level: number | null
          processing_fee_amount: number | null
          quarterly_report_id: string | null
          royalties_to_date: number
          statement_notes: string | null
          statement_pdf_url: string | null
          status: string | null
          total_expenses: number
          total_royalties: number | null
          updated_at: string
          user_id: string
          workflow_stage: string | null
        }
        Insert: {
          admin_fee_amount?: number | null
          admin_fee_percentage?: number | null
          amount_due?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          auto_payment_enabled?: boolean | null
          client_id: string
          commissions_amount?: number | null
          created_at?: string
          failure_reason?: string | null
          gross_royalties?: number
          id?: string
          net_payable?: number
          net_royalties?: number | null
          notes?: string | null
          payment_completed_at?: string | null
          payment_date?: string | null
          payment_failed_at?: string | null
          payment_initiated_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_processor?: string | null
          payment_processor_reference?: string | null
          payment_reference?: string | null
          payments_to_date?: number
          period: string
          period_end?: string | null
          period_start?: string | null
          priority_level?: number | null
          processing_fee_amount?: number | null
          quarterly_report_id?: string | null
          royalties_to_date?: number
          statement_notes?: string | null
          statement_pdf_url?: string | null
          status?: string | null
          total_expenses?: number
          total_royalties?: number | null
          updated_at?: string
          user_id: string
          workflow_stage?: string | null
        }
        Update: {
          admin_fee_amount?: number | null
          admin_fee_percentage?: number | null
          amount_due?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          auto_payment_enabled?: boolean | null
          client_id?: string
          commissions_amount?: number | null
          created_at?: string
          failure_reason?: string | null
          gross_royalties?: number
          id?: string
          net_payable?: number
          net_royalties?: number | null
          notes?: string | null
          payment_completed_at?: string | null
          payment_date?: string | null
          payment_failed_at?: string | null
          payment_initiated_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_processor?: string | null
          payment_processor_reference?: string | null
          payment_reference?: string | null
          payments_to_date?: number
          period?: string
          period_end?: string | null
          period_start?: string | null
          priority_level?: number | null
          processing_fee_amount?: number | null
          quarterly_report_id?: string | null
          royalties_to_date?: number
          statement_notes?: string | null
          statement_pdf_url?: string | null
          status?: string | null
          total_expenses?: number
          total_royalties?: number | null
          updated_at?: string
          user_id?: string
          workflow_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_quarterly_report_id_fkey"
            columns: ["quarterly_report_id"]
            isOneToOne: false
            referencedRelation: "quarterly_balance_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          benchmark_value: number | null
          calculation_method: string | null
          created_at: string | null
          entity_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          period_end: string
          period_start: string
          trend_direction: string | null
          updated_at: string | null
          variance_percentage: number | null
        }
        Insert: {
          benchmark_value?: number | null
          calculation_method?: string | null
          created_at?: string | null
          entity_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          period_end: string
          period_start: string
          trend_direction?: string | null
          updated_at?: string | null
          variance_percentage?: number | null
        }
        Update: {
          benchmark_value?: number | null
          calculation_method?: string | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          period_end?: string
          period_start?: string
          trend_direction?: string | null
          updated_at?: string | null
          variance_percentage?: number | null
        }
        Relationships: []
      }
      predictive_analytics_cache: {
        Row: {
          calculation_date: string
          confidence_score: number
          contributing_factors: Json
          created_at: string | null
          customer_user_id: string
          expires_at: string
          id: string
          metadata: Json | null
          model_version: string | null
          prediction_type: string
          prediction_value: number
          updated_at: string | null
        }
        Insert: {
          calculation_date?: string
          confidence_score: number
          contributing_factors?: Json
          created_at?: string | null
          customer_user_id: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          model_version?: string | null
          prediction_type: string
          prediction_value: number
          updated_at?: string | null
        }
        Update: {
          calculation_date?: string
          confidence_score?: number
          contributing_factors?: Json
          created_at?: string | null
          customer_user_id?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          model_version?: string | null
          prediction_type?: string
          prediction_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      pro_ftp_credentials: {
        Row: {
          base_path: string | null
          connection_status: string | null
          connection_type: string
          created_at: string
          host: string
          id: string
          is_active: boolean | null
          last_connection_test: string | null
          password_encrypted: string
          port: number
          pro_code: string
          pro_name: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          base_path?: string | null
          connection_status?: string | null
          connection_type?: string
          created_at?: string
          host: string
          id?: string
          is_active?: boolean | null
          last_connection_test?: string | null
          password_encrypted: string
          port?: number
          pro_code: string
          pro_name: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          base_path?: string | null
          connection_status?: string | null
          connection_type?: string
          created_at?: string
          host?: string
          id?: string
          is_active?: boolean | null
          last_connection_test?: string | null
          password_encrypted?: string
          port?: number
          pro_code?: string
          pro_name?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_complete: boolean
          phone: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quarterly_balance_reports: {
        Row: {
          agreement_id: string | null
          calculation_date: string | null
          closing_balance: number
          contact_id: string | null
          created_at: string
          expenses_amount: number
          id: string
          is_calculated: boolean
          opening_balance: number
          payee_id: string
          payments_amount: number
          period_label: string | null
          quarter: number
          royalties_amount: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          agreement_id?: string | null
          calculation_date?: string | null
          closing_balance?: number
          contact_id?: string | null
          created_at?: string
          expenses_amount?: number
          id?: string
          is_calculated?: boolean
          opening_balance?: number
          payee_id: string
          payments_amount?: number
          period_label?: string | null
          quarter: number
          royalties_amount?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          agreement_id?: string | null
          calculation_date?: string | null
          closing_balance?: number
          contact_id?: string | null
          created_at?: string
          expenses_amount?: number
          id?: string
          is_calculated?: boolean
          opening_balance?: number
          payee_id?: string
          payments_amount?: number
          period_label?: string | null
          quarter?: number
          royalties_amount?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quarterly_balance_reports_payee_id"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quarterly_balance_reports_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quarterly_balance_reports_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          first_attempt: string | null
          id: string
          identifier: string
          last_attempt: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          first_attempt?: string | null
          id?: string
          identifier: string
          last_attempt?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          first_attempt?: string | null
          id?: string
          identifier?: string
          last_attempt?: string | null
        }
        Relationships: []
      }
      realtime_monitoring_events: {
        Row: {
          acknowledged_at: string | null
          assigned_to: string | null
          created_at: string
          event_data: Json
          event_source: string
          event_type: string
          id: string
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          created_at?: string
          event_data?: Json
          event_source: string
          event_type: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          created_at?: string
          event_data?: Json
          event_source?: string
          event_type?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_batches: {
        Row: {
          batch_id: string | null
          created_at: string
          date_received: string
          id: string
          linked_statement_id: string | null
          notes: string | null
          processed_at: string | null
          processed_by_user_id: string | null
          processing_count: number | null
          source: Database["public"]["Enums"]["royalty_source"]
          statement_file_url: string | null
          statement_period_end: string | null
          statement_period_start: string | null
          statement_total: number | null
          status: Database["public"]["Enums"]["batch_status"]
          total_gross_amount: number | null
          unprocessed_at: string | null
          unprocessed_by_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          date_received?: string
          id?: string
          linked_statement_id?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by_user_id?: string | null
          processing_count?: number | null
          source: Database["public"]["Enums"]["royalty_source"]
          statement_file_url?: string | null
          statement_period_end?: string | null
          statement_period_start?: string | null
          statement_total?: number | null
          status?: Database["public"]["Enums"]["batch_status"]
          total_gross_amount?: number | null
          unprocessed_at?: string | null
          unprocessed_by_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          date_received?: string
          id?: string
          linked_statement_id?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by_user_id?: string | null
          processing_count?: number | null
          source?: Database["public"]["Enums"]["royalty_source"]
          statement_file_url?: string | null
          statement_period_end?: string | null
          statement_period_start?: string | null
          statement_total?: number | null
          status?: Database["public"]["Enums"]["batch_status"]
          total_gross_amount?: number | null
          unprocessed_at?: string | null
          unprocessed_by_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_batches_linked_statement_id_fkey"
            columns: ["linked_statement_id"]
            isOneToOne: false
            referencedRelation: "royalties_import_staging"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_status: string
          previous_status: string | null
          status_reason: string | null
          submission_id: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status: string
          previous_status?: string | null
          status_reason?: string | null
          submission_id?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string
          previous_status?: string | null
          status_reason?: string | null
          submission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_status_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "cwr_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          customer_user_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          mrr_change: number | null
          new_plan: string | null
          previous_plan: string | null
          revenue_amount: number | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          mrr_change?: number | null
          new_plan?: string | null
          previous_plan?: string | null
          revenue_amount?: number | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          mrr_change?: number | null
          new_plan?: string | null
          previous_plan?: string | null
          revenue_amount?: number | null
        }
        Relationships: []
      }
      royalties_import_staging: {
        Row: {
          batch_id: string | null
          created_at: string
          detected_source: string
          id: string
          import_tags: string[] | null
          mapped_data: Json
          mapping_version: string
          original_filename: string
          payee_matches: Json | null
          processing_status: string | null
          raw_data: Json
          statement_id: string | null
          unmapped_fields: string[] | null
          updated_at: string
          user_id: string
          validation_status: Json | null
          work_matches: Json | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          detected_source: string
          id?: string
          import_tags?: string[] | null
          mapped_data: Json
          mapping_version?: string
          original_filename: string
          payee_matches?: Json | null
          processing_status?: string | null
          raw_data: Json
          statement_id?: string | null
          unmapped_fields?: string[] | null
          updated_at?: string
          user_id: string
          validation_status?: Json | null
          work_matches?: Json | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          detected_source?: string
          id?: string
          import_tags?: string[] | null
          mapped_data?: Json
          mapping_version?: string
          original_filename?: string
          payee_matches?: Json | null
          processing_status?: string | null
          raw_data?: Json
          statement_id?: string | null
          unmapped_fields?: string[] | null
          updated_at?: string
          user_id?: string
          validation_status?: Json | null
          work_matches?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "royalties_import_staging_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_allocations: {
        Row: {
          artist: string | null
          batch_id: string | null
          comments: string | null
          controlled_status:
            | Database["public"]["Enums"]["controlled_status"]
            | null
          copyright_id: string | null
          country: string | null
          created_at: string
          gross_amount: number | null
          gross_royalty_amount: number
          id: string
          isrc: string | null
          iswc: string | null
          mapped_data: Json | null
          media_sub_type: string | null
          media_type: string | null
          net_amount: number | null
          ownership_splits: Json | null
          quantity: string | null
          quarter: string | null
          recoupable_expenses: boolean | null
          revenue_source: string | null
          royalty_id: string
          share: string | null
          song_title: string
          source: string | null
          staging_record_id: string | null
          statement_id: string | null
          updated_at: string
          user_id: string
          work_id: string | null
          work_identifier: string | null
          work_writers: string | null
        }
        Insert: {
          artist?: string | null
          batch_id?: string | null
          comments?: string | null
          controlled_status?:
            | Database["public"]["Enums"]["controlled_status"]
            | null
          copyright_id?: string | null
          country?: string | null
          created_at?: string
          gross_amount?: number | null
          gross_royalty_amount?: number
          id?: string
          isrc?: string | null
          iswc?: string | null
          mapped_data?: Json | null
          media_sub_type?: string | null
          media_type?: string | null
          net_amount?: number | null
          ownership_splits?: Json | null
          quantity?: string | null
          quarter?: string | null
          recoupable_expenses?: boolean | null
          revenue_source?: string | null
          royalty_id: string
          share?: string | null
          song_title: string
          source?: string | null
          staging_record_id?: string | null
          statement_id?: string | null
          updated_at?: string
          user_id: string
          work_id?: string | null
          work_identifier?: string | null
          work_writers?: string | null
        }
        Update: {
          artist?: string | null
          batch_id?: string | null
          comments?: string | null
          controlled_status?:
            | Database["public"]["Enums"]["controlled_status"]
            | null
          copyright_id?: string | null
          country?: string | null
          created_at?: string
          gross_amount?: number | null
          gross_royalty_amount?: number
          id?: string
          isrc?: string | null
          iswc?: string | null
          mapped_data?: Json | null
          media_sub_type?: string | null
          media_type?: string | null
          net_amount?: number | null
          ownership_splits?: Json | null
          quantity?: string | null
          quarter?: string | null
          recoupable_expenses?: boolean | null
          revenue_source?: string | null
          royalty_id?: string
          share?: string | null
          song_title?: string
          source?: string | null
          staging_record_id?: string | null
          statement_id?: string | null
          updated_at?: string
          user_id?: string
          work_id?: string | null
          work_identifier?: string | null
          work_writers?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "royalty_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "royalty_allocations_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_pipeline_estimates: {
        Row: {
          annual_estimate: number | null
          calculation_details: Json | null
          calculation_method: string | null
          confidence_level: string | null
          created_at: string
          estimate_type: string
          factors_considered: Json | null
          id: string
          missing_registrations_impact: number | null
          potential_upside: number | null
          song_metadata_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_estimate?: number | null
          calculation_details?: Json | null
          calculation_method?: string | null
          confidence_level?: string | null
          created_at?: string
          estimate_type: string
          factors_considered?: Json | null
          id?: string
          missing_registrations_impact?: number | null
          potential_upside?: number | null
          song_metadata_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_estimate?: number | null
          calculation_details?: Json | null
          calculation_method?: string | null
          confidence_level?: string | null
          created_at?: string
          estimate_type?: string
          factors_considered?: Json | null
          id?: string
          missing_registrations_impact?: number | null
          potential_upside?: number | null
          song_metadata_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "royalty_pipeline_estimates_song_metadata_id_fkey"
            columns: ["song_metadata_id"]
            isOneToOne: false
            referencedRelation: "song_metadata_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_writers: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          mechanical_share: number | null
          performance_share: number | null
          royalty_id: string
          synchronization_share: number | null
          writer_share_percentage: number
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          mechanical_share?: number | null
          performance_share?: number | null
          royalty_id: string
          synchronization_share?: number | null
          writer_share_percentage?: number
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          mechanical_share?: number | null
          performance_share?: number | null
          royalty_id?: string
          synchronization_share?: number | null
          writer_share_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "royalty_writers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "royalty_writers_royalty_id_fkey"
            columns: ["royalty_id"]
            isOneToOne: false
            referencedRelation: "royalty_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_valuation_scenarios: {
        Row: {
          artist_name: string
          cash_flow_projections: Json | null
          catalog_age_years: number | null
          comparable_artists: Json | null
          confidence_score: number | null
          created_at: string | null
          dcf_valuation: number | null
          discount_rate: number | null
          forecasts: Json | null
          genre: string | null
          has_additional_revenue: boolean | null
          id: string
          industry_benchmarks: Json | null
          is_favorite: boolean | null
          ltm_revenue: number | null
          monthly_listeners: number | null
          multiple_valuation: number | null
          notes: string | null
          popularity_score: number | null
          revenue_diversification_score: number | null
          risk_adjusted_value: number | null
          scenario_name: string
          tags: string[] | null
          top_tracks: Json | null
          total_additional_revenue: number | null
          total_streams: number | null
          updated_at: string | null
          user_id: string
          valuation_amount: number | null
          valuation_methodology: string | null
        }
        Insert: {
          artist_name: string
          cash_flow_projections?: Json | null
          catalog_age_years?: number | null
          comparable_artists?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          dcf_valuation?: number | null
          discount_rate?: number | null
          forecasts?: Json | null
          genre?: string | null
          has_additional_revenue?: boolean | null
          id?: string
          industry_benchmarks?: Json | null
          is_favorite?: boolean | null
          ltm_revenue?: number | null
          monthly_listeners?: number | null
          multiple_valuation?: number | null
          notes?: string | null
          popularity_score?: number | null
          revenue_diversification_score?: number | null
          risk_adjusted_value?: number | null
          scenario_name: string
          tags?: string[] | null
          top_tracks?: Json | null
          total_additional_revenue?: number | null
          total_streams?: number | null
          updated_at?: string | null
          user_id: string
          valuation_amount?: number | null
          valuation_methodology?: string | null
        }
        Update: {
          artist_name?: string
          cash_flow_projections?: Json | null
          catalog_age_years?: number | null
          comparable_artists?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          dcf_valuation?: number | null
          discount_rate?: number | null
          forecasts?: Json | null
          genre?: string | null
          has_additional_revenue?: boolean | null
          id?: string
          industry_benchmarks?: Json | null
          is_favorite?: boolean | null
          ltm_revenue?: number | null
          monthly_listeners?: number | null
          multiple_valuation?: number | null
          notes?: string | null
          popularity_score?: number | null
          revenue_diversification_score?: number | null
          risk_adjusted_value?: number | null
          scenario_name?: string
          tags?: string[] | null
          top_tracks?: Json | null
          total_additional_revenue?: number | null
          total_streams?: number | null
          updated_at?: string | null
          user_id?: string
          valuation_amount?: number | null
          valuation_methodology?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          notes: string | null
          resolved_at: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      song_catalog_searches: {
        Row: {
          ai_research_summary: Json | null
          created_at: string
          id: string
          last_refreshed_at: string | null
          metadata_complete_count: number | null
          pipeline_estimate_total: number | null
          search_parameters: Json | null
          search_status: string
          songwriter_name: string
          total_songs_found: number | null
          updated_at: string
          user_id: string
          webhook_status: string | null
        }
        Insert: {
          ai_research_summary?: Json | null
          created_at?: string
          id?: string
          last_refreshed_at?: string | null
          metadata_complete_count?: number | null
          pipeline_estimate_total?: number | null
          search_parameters?: Json | null
          search_status?: string
          songwriter_name: string
          total_songs_found?: number | null
          updated_at?: string
          user_id: string
          webhook_status?: string | null
        }
        Update: {
          ai_research_summary?: Json | null
          created_at?: string
          id?: string
          last_refreshed_at?: string | null
          metadata_complete_count?: number | null
          pipeline_estimate_total?: number | null
          search_parameters?: Json | null
          search_status?: string
          songwriter_name?: string
          total_songs_found?: number | null
          updated_at?: string
          user_id?: string
          webhook_status?: string | null
        }
        Relationships: []
      }
      song_match_history: {
        Row: {
          artist_name: string | null
          copyright_id: string | null
          created_at: string
          id: string
          match_confidence: number | null
          match_type: string
          song_title: string
          source_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_name?: string | null
          copyright_id?: string | null
          created_at?: string
          id?: string
          match_confidence?: number | null
          match_type?: string
          song_title: string
          source_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_name?: string | null
          copyright_id?: string | null
          created_at?: string
          id?: string
          match_confidence?: number | null
          match_type?: string
          song_title?: string
          source_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_match_history_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
        ]
      }
      song_metadata_cache: {
        Row: {
          co_writers: string[] | null
          created_at: string
          data_quality_score: number | null
          estimated_splits: Json | null
          id: string
          iswc: string | null
          last_mlc_lookup_at: string | null
          last_verified_at: string | null
          metadata_completeness_score: number | null
          mlc_confidence_score: number | null
          mlc_metadata: Json | null
          mlc_publishers: Json | null
          mlc_verification_status: string | null
          mlc_work_id: string | null
          mlc_writers: Json | null
          pro_registrations: Json | null
          publishers: Json | null
          registration_gaps: string[] | null
          search_id: string
          search_key: string | null
          song_title: string
          songwriter_name: string
          source_data: Json | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          co_writers?: string[] | null
          created_at?: string
          data_quality_score?: number | null
          estimated_splits?: Json | null
          id?: string
          iswc?: string | null
          last_mlc_lookup_at?: string | null
          last_verified_at?: string | null
          metadata_completeness_score?: number | null
          mlc_confidence_score?: number | null
          mlc_metadata?: Json | null
          mlc_publishers?: Json | null
          mlc_verification_status?: string | null
          mlc_work_id?: string | null
          mlc_writers?: Json | null
          pro_registrations?: Json | null
          publishers?: Json | null
          registration_gaps?: string[] | null
          search_id: string
          search_key?: string | null
          song_title: string
          songwriter_name: string
          source_data?: Json | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          co_writers?: string[] | null
          created_at?: string
          data_quality_score?: number | null
          estimated_splits?: Json | null
          id?: string
          iswc?: string | null
          last_mlc_lookup_at?: string | null
          last_verified_at?: string | null
          metadata_completeness_score?: number | null
          mlc_confidence_score?: number | null
          mlc_metadata?: Json | null
          mlc_publishers?: Json | null
          mlc_verification_status?: string | null
          mlc_work_id?: string | null
          mlc_writers?: Json | null
          pro_registrations?: Json | null
          publishers?: Json | null
          registration_gaps?: string[] | null
          search_id?: string
          search_key?: string | null
          song_title?: string
          songwriter_name?: string
          source_data?: Json | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_metadata_cache_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "song_catalog_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      songwriter_profiles: {
        Row: {
          ai_profile_summary: string | null
          career_period_end: string | null
          career_period_start: string | null
          confidence_score: number | null
          created_at: string
          estimated_catalog_size: number | null
          id: string
          known_aliases: string[] | null
          primary_genres: string[] | null
          pro_affiliations: Json | null
          songwriter_name: string
          updated_at: string
          user_id: string
          verified_writer_codes: Json | null
        }
        Insert: {
          ai_profile_summary?: string | null
          career_period_end?: string | null
          career_period_start?: string | null
          confidence_score?: number | null
          created_at?: string
          estimated_catalog_size?: number | null
          id?: string
          known_aliases?: string[] | null
          primary_genres?: string[] | null
          pro_affiliations?: Json | null
          songwriter_name: string
          updated_at?: string
          user_id: string
          verified_writer_codes?: Json | null
        }
        Update: {
          ai_profile_summary?: string | null
          career_period_end?: string | null
          career_period_start?: string | null
          confidence_score?: number | null
          created_at?: string
          estimated_catalog_size?: number | null
          id?: string
          known_aliases?: string[] | null
          primary_genres?: string[] | null
          pro_affiliations?: Json | null
          songwriter_name?: string
          updated_at?: string
          user_id?: string
          verified_writer_codes?: Json | null
        }
        Relationships: []
      }
      source_mapping_config: {
        Row: {
          created_at: string
          header_patterns: string[] | null
          id: string
          is_active: boolean | null
          mapping_rules: Json
          source_name: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          header_patterns?: string[] | null
          id?: string
          is_active?: boolean | null
          mapping_rules: Json
          source_name: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          header_patterns?: string[] | null
          id?: string
          is_active?: boolean | null
          mapping_rules?: Json
          source_name?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      sub_accounts_field_mappings: {
        Row: {
          created_at: string | null
          default_values: Json | null
          field_mappings: Json
          file_type: string
          id: string
          is_active: boolean | null
          mapping_name: string
          transformation_rules: Json | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          default_values?: Json | null
          field_mappings: Json
          file_type: string
          id?: string
          is_active?: boolean | null
          mapping_name: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          default_values?: Json | null
          field_mappings?: Json
          file_type?: string
          id?: string
          is_active?: boolean | null
          mapping_name?: string
          transformation_rules?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      sub_accounts_staging: {
        Row: {
          created_at: string | null
          id: string
          mapped_data: Json | null
          processed: boolean | null
          raw_data: Json
          row_number: number
          target_subscriber_id: string | null
          upload_job_id: string | null
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mapped_data?: Json | null
          processed?: boolean | null
          raw_data: Json
          row_number: number
          target_subscriber_id?: string | null
          upload_job_id?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mapped_data?: Json | null
          processed?: boolean | null
          raw_data?: Json
          row_number?: number
          target_subscriber_id?: string | null
          upload_job_id?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_accounts_staging_upload_job_id_fkey"
            columns: ["upload_job_id"]
            isOneToOne: false
            referencedRelation: "sub_accounts_upload_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_accounts_upload_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_log: Json | null
          failed_records: number | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          job_name: string
          processed_records: number | null
          processing_stats: Json | null
          started_at: string | null
          status: string | null
          successful_records: number | null
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          job_name: string
          processed_records?: number | null
          processing_stats?: Json | null
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          job_name?: string
          processed_records?: number | null
          processing_stats?: Json | null
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_addons: {
        Row: {
          addon_type: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          limit_increase: number | null
          monthly_price: number
          name: string
          slug: string
          target_limit_field: string | null
          updated_at: string
        }
        Insert: {
          addon_type: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limit_increase?: number | null
          monthly_price: number
          name: string
          slug: string
          target_limit_field?: string | null
          updated_at?: string
        }
        Update: {
          addon_type?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limit_increase?: number | null
          monthly_price?: number
          name?: string
          slug?: string
          target_limit_field?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          annual_price: number | null
          api_access_enabled: boolean
          created_at: string
          custom_branding: boolean
          description: string | null
          features: Json
          id: string
          included_modules: string[]
          is_active: boolean
          is_popular: boolean
          max_contracts_per_month: number | null
          max_deal_simulations_per_month: number | null
          max_valuations_per_month: number | null
          monthly_price: number
          name: string
          priority_support: boolean
          slug: string
          tier_level: number
          updated_at: string
        }
        Insert: {
          annual_price?: number | null
          api_access_enabled?: boolean
          created_at?: string
          custom_branding?: boolean
          description?: string | null
          features?: Json
          id?: string
          included_modules?: string[]
          is_active?: boolean
          is_popular?: boolean
          max_contracts_per_month?: number | null
          max_deal_simulations_per_month?: number | null
          max_valuations_per_month?: number | null
          monthly_price: number
          name: string
          priority_support?: boolean
          slug: string
          tier_level: number
          updated_at?: string
        }
        Update: {
          annual_price?: number | null
          api_access_enabled?: boolean
          created_at?: string
          custom_branding?: boolean
          description?: string | null
          features?: Json
          id?: string
          included_modules?: string[]
          is_active?: boolean
          is_popular?: boolean
          max_contracts_per_month?: number | null
          max_deal_simulations_per_month?: number | null
          max_valuations_per_month?: number | null
          monthly_price?: number
          name?: string
          priority_support?: boolean
          slug?: string
          tier_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_ticket_analytics: {
        Row: {
          assigned_team_member_id: string | null
          created_at: string | null
          customer_satisfaction_score: number | null
          customer_user_id: string | null
          first_response_time_hours: number | null
          id: string
          priority_level: string | null
          resolution_time_hours: number | null
          resolved_at: string | null
          status: string | null
          tags: string[] | null
          ticket_category: string
          ticket_subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_team_member_id?: string | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          customer_user_id?: string | null
          first_response_time_hours?: number | null
          id?: string
          priority_level?: string | null
          resolution_time_hours?: number | null
          resolved_at?: string | null
          status?: string | null
          tags?: string[] | null
          ticket_category: string
          ticket_subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_team_member_id?: string | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          customer_user_id?: string | null
          first_response_time_hours?: number | null
          id?: string
          priority_level?: string | null
          resolution_time_hours?: number | null
          resolved_at?: string | null
          status?: string | null
          tags?: string[] | null
          ticket_category?: string
          ticket_subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_analytics_assigned_team_member_id_fkey"
            columns: ["assigned_team_member_id"]
            isOneToOne: false
            referencedRelation: "operations_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_data: Json
          invoice_number: string
          license_id: string
          paid_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_data?: Json
          invoice_number: string
          license_id: string
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_data?: Json
          invoice_number?: string
          license_id?: string
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_invoices_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "sync_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_license_comments: {
        Row: {
          comment: string
          comment_type: string | null
          created_at: string
          id: string
          sync_license_id: string
          user_id: string
        }
        Insert: {
          comment: string
          comment_type?: string | null
          created_at?: string
          id?: string
          sync_license_id: string
          user_id: string
        }
        Update: {
          comment?: string
          comment_type?: string | null
          created_at?: string
          id?: string
          sync_license_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_license_comments_sync_license_id_fkey"
            columns: ["sync_license_id"]
            isOneToOne: false
            referencedRelation: "sync_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_licenses: {
        Row: {
          advance_amount: number | null
          amendment_urls: string[] | null
          approval_documentation_url: string | null
          approval_issued: string | null
          audio_file_url: string | null
          audio_mix_level: number | null
          backend_percentage: number | null
          banking_instructions: Json | null
          check_copy_remittance_url: string | null
          clearance_notes: string | null
          contract_executed_date: string | null
          contract_execution_status: string | null
          contract_expiry_date: string | null
          contract_sent_date: string | null
          contract_signed_date: string | null
          controlled_writers: Json | null
          created_at: string
          credit_language: string | null
          credit_placement: string | null
          credit_requirements: Json | null
          credit_size: string | null
          currency: string | null
          episode_season: string | null
          executed_agreement_url: string | null
          fe_license_returned: boolean | null
          fe_license_url: string | null
          fee_allocations: Json | null
          first_confirmation_of_use: string | null
          id: string
          instrumental_vocal: string | null
          invoice_issued: string | null
          invoice_status: string | null
          invoiced_amount: number | null
          license_issued: string | null
          license_status: string | null
          licensee_address: string | null
          licensee_company: string | null
          licensee_email: string | null
          licensee_name: string | null
          licensee_phone: string | null
          licensor_address: string | null
          licensor_company: string | null
          licensor_email: string | null
          licensor_name: string | null
          licensor_phone: string | null
          linked_copyright_ids: string[] | null
          master_fee: number | null
          master_rights_cleared: boolean | null
          master_share_percentage: number | null
          master_splits: Json | null
          mechanical_rights_cleared: boolean | null
          media_type: string | null
          mfn: boolean | null
          music_prominence: string | null
          music_timing_notes: string | null
          music_type: string | null
          music_use: string | null
          notarization_date: string | null
          notarization_required: boolean | null
          notes: string | null
          payment_due_date: string | null
          payment_method: string | null
          payment_received: string | null
          payment_reference: string | null
          payment_status: string | null
          pe_license_received: string | null
          performance_rights_cleared: boolean | null
          platforms: string | null
          project_title: string
          pub_fee: number | null
          pub_fee_all_in: number | null
          pub_share_percentage: number | null
          publisher_splits: Json | null
          publishing_rights_cleared: boolean | null
          request_attachment_url: string | null
          request_received: string | null
          rights_clearance_type: string | null
          rights_cleared: boolean | null
          royalties: string | null
          scene_description: string | null
          scene_duration_seconds: number | null
          scene_timestamp: string | null
          signatory_name: string | null
          signatory_title: string | null
          signed_agreement_url: string | null
          smpte: string | null
          source: string | null
          supporting_documents: Json | null
          synch_agent: string | null
          synch_id: string
          synch_status: string | null
          synchronization_rights_cleared: boolean | null
          term_duration: string | null
          term_end: string | null
          term_start: string | null
          territories: string[] | null
          territory: string | null
          territory_of_licensee: string | null
          updated_at: string
          user_id: string
          witness_name: string | null
        }
        Insert: {
          advance_amount?: number | null
          amendment_urls?: string[] | null
          approval_documentation_url?: string | null
          approval_issued?: string | null
          audio_file_url?: string | null
          audio_mix_level?: number | null
          backend_percentage?: number | null
          banking_instructions?: Json | null
          check_copy_remittance_url?: string | null
          clearance_notes?: string | null
          contract_executed_date?: string | null
          contract_execution_status?: string | null
          contract_expiry_date?: string | null
          contract_sent_date?: string | null
          contract_signed_date?: string | null
          controlled_writers?: Json | null
          created_at?: string
          credit_language?: string | null
          credit_placement?: string | null
          credit_requirements?: Json | null
          credit_size?: string | null
          currency?: string | null
          episode_season?: string | null
          executed_agreement_url?: string | null
          fe_license_returned?: boolean | null
          fe_license_url?: string | null
          fee_allocations?: Json | null
          first_confirmation_of_use?: string | null
          id?: string
          instrumental_vocal?: string | null
          invoice_issued?: string | null
          invoice_status?: string | null
          invoiced_amount?: number | null
          license_issued?: string | null
          license_status?: string | null
          licensee_address?: string | null
          licensee_company?: string | null
          licensee_email?: string | null
          licensee_name?: string | null
          licensee_phone?: string | null
          licensor_address?: string | null
          licensor_company?: string | null
          licensor_email?: string | null
          licensor_name?: string | null
          licensor_phone?: string | null
          linked_copyright_ids?: string[] | null
          master_fee?: number | null
          master_rights_cleared?: boolean | null
          master_share_percentage?: number | null
          master_splits?: Json | null
          mechanical_rights_cleared?: boolean | null
          media_type?: string | null
          mfn?: boolean | null
          music_prominence?: string | null
          music_timing_notes?: string | null
          music_type?: string | null
          music_use?: string | null
          notarization_date?: string | null
          notarization_required?: boolean | null
          notes?: string | null
          payment_due_date?: string | null
          payment_method?: string | null
          payment_received?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pe_license_received?: string | null
          performance_rights_cleared?: boolean | null
          platforms?: string | null
          project_title: string
          pub_fee?: number | null
          pub_fee_all_in?: number | null
          pub_share_percentage?: number | null
          publisher_splits?: Json | null
          publishing_rights_cleared?: boolean | null
          request_attachment_url?: string | null
          request_received?: string | null
          rights_clearance_type?: string | null
          rights_cleared?: boolean | null
          royalties?: string | null
          scene_description?: string | null
          scene_duration_seconds?: number | null
          scene_timestamp?: string | null
          signatory_name?: string | null
          signatory_title?: string | null
          signed_agreement_url?: string | null
          smpte?: string | null
          source?: string | null
          supporting_documents?: Json | null
          synch_agent?: string | null
          synch_id: string
          synch_status?: string | null
          synchronization_rights_cleared?: boolean | null
          term_duration?: string | null
          term_end?: string | null
          term_start?: string | null
          territories?: string[] | null
          territory?: string | null
          territory_of_licensee?: string | null
          updated_at?: string
          user_id: string
          witness_name?: string | null
        }
        Update: {
          advance_amount?: number | null
          amendment_urls?: string[] | null
          approval_documentation_url?: string | null
          approval_issued?: string | null
          audio_file_url?: string | null
          audio_mix_level?: number | null
          backend_percentage?: number | null
          banking_instructions?: Json | null
          check_copy_remittance_url?: string | null
          clearance_notes?: string | null
          contract_executed_date?: string | null
          contract_execution_status?: string | null
          contract_expiry_date?: string | null
          contract_sent_date?: string | null
          contract_signed_date?: string | null
          controlled_writers?: Json | null
          created_at?: string
          credit_language?: string | null
          credit_placement?: string | null
          credit_requirements?: Json | null
          credit_size?: string | null
          currency?: string | null
          episode_season?: string | null
          executed_agreement_url?: string | null
          fe_license_returned?: boolean | null
          fe_license_url?: string | null
          fee_allocations?: Json | null
          first_confirmation_of_use?: string | null
          id?: string
          instrumental_vocal?: string | null
          invoice_issued?: string | null
          invoice_status?: string | null
          invoiced_amount?: number | null
          license_issued?: string | null
          license_status?: string | null
          licensee_address?: string | null
          licensee_company?: string | null
          licensee_email?: string | null
          licensee_name?: string | null
          licensee_phone?: string | null
          licensor_address?: string | null
          licensor_company?: string | null
          licensor_email?: string | null
          licensor_name?: string | null
          licensor_phone?: string | null
          linked_copyright_ids?: string[] | null
          master_fee?: number | null
          master_rights_cleared?: boolean | null
          master_share_percentage?: number | null
          master_splits?: Json | null
          mechanical_rights_cleared?: boolean | null
          media_type?: string | null
          mfn?: boolean | null
          music_prominence?: string | null
          music_timing_notes?: string | null
          music_type?: string | null
          music_use?: string | null
          notarization_date?: string | null
          notarization_required?: boolean | null
          notes?: string | null
          payment_due_date?: string | null
          payment_method?: string | null
          payment_received?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          pe_license_received?: string | null
          performance_rights_cleared?: boolean | null
          platforms?: string | null
          project_title?: string
          pub_fee?: number | null
          pub_fee_all_in?: number | null
          pub_share_percentage?: number | null
          publisher_splits?: Json | null
          publishing_rights_cleared?: boolean | null
          request_attachment_url?: string | null
          request_received?: string | null
          rights_clearance_type?: string | null
          rights_cleared?: boolean | null
          royalties?: string | null
          scene_description?: string | null
          scene_duration_seconds?: number | null
          scene_timestamp?: string | null
          signatory_name?: string | null
          signatory_title?: string | null
          signed_agreement_url?: string | null
          smpte?: string | null
          source?: string | null
          supporting_documents?: Json | null
          synch_agent?: string | null
          synch_id?: string
          synch_status?: string | null
          synchronization_rights_cleared?: boolean | null
          term_duration?: string | null
          term_end?: string | null
          term_start?: string | null
          territories?: string[] | null
          territory?: string | null
          territory_of_licensee?: string | null
          updated_at?: string
          user_id?: string
          witness_name?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_message: string
          alert_name: string
          alert_type: string
          assigned_to: string | null
          created_at: string
          id: string
          resolved_at: string | null
          severity: string
          status: string
          trigger_data: Json | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_message: string
          alert_name: string
          alert_type: string
          assigned_to?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          trigger_data?: Json | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_message?: string
          alert_name?: string
          alert_type?: string
          assigned_to?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          trigger_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_configurations: {
        Row: {
          brand_config: Json
          company_info: Json
          created_at: string
          custom_domain: string | null
          enabled_modules: Json
          feature_flags: Json
          id: string
          max_users: number | null
          ssl_enabled: boolean | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string | null
          subscription_tier: string | null
          tenant_name: string
          tenant_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_config?: Json
          company_info?: Json
          created_at?: string
          custom_domain?: string | null
          enabled_modules?: Json
          feature_flags?: Json
          id?: string
          max_users?: number | null
          ssl_enabled?: boolean | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain?: string | null
          subscription_tier?: string | null
          tenant_name: string
          tenant_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_config?: Json
          company_info?: Json
          created_at?: string
          custom_domain?: string | null
          enabled_modules?: Json
          feature_flags?: Json
          id?: string
          max_users?: number | null
          ssl_enabled?: boolean | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain?: string | null
          subscription_tier?: string | null
          tenant_name?: string
          tenant_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          permissions: Json
          role: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      track_tags: {
        Row: {
          album: string | null
          analysis_confidence: number | null
          analysis_status: string | null
          artist: string | null
          created_at: string
          duration_seconds: number | null
          energy_level: string | null
          file_url: string
          filename: string
          genre: string | null
          genre_subgenre: string[] | null
          id: string
          instrumentation: string[] | null
          lyrical_themes: string[] | null
          manual_overrides: Json | null
          mood_emotion: string[] | null
          scene_use_case: string[] | null
          structure_tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          vocal_type: string | null
          year: number | null
        }
        Insert: {
          album?: string | null
          analysis_confidence?: number | null
          analysis_status?: string | null
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          energy_level?: string | null
          file_url: string
          filename: string
          genre?: string | null
          genre_subgenre?: string[] | null
          id?: string
          instrumentation?: string[] | null
          lyrical_themes?: string[] | null
          manual_overrides?: Json | null
          mood_emotion?: string[] | null
          scene_use_case?: string[] | null
          structure_tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          vocal_type?: string | null
          year?: number | null
        }
        Update: {
          album?: string | null
          analysis_confidence?: number | null
          analysis_status?: string | null
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          energy_level?: string | null
          file_url?: string
          filename?: string
          genre?: string | null
          genre_subgenre?: string[] | null
          id?: string
          instrumentation?: string[] | null
          lyrical_themes?: string[] | null
          manual_overrides?: Json | null
          mood_emotion?: string[] | null
          scene_use_case?: string[] | null
          structure_tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          vocal_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      user_addon_subscriptions: {
        Row: {
          addon_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          started_at: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          addon_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          addon_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addon_subscriptions_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "subscription_addons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_free_trials: {
        Row: {
          created_at: string
          id: string
          stripe_subscription_id: string | null
          trial_end_date: string
          trial_identifier: string
          trial_modules: string[]
          trial_start_date: string
          trial_status: string
          trial_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_subscription_id?: string | null
          trial_end_date?: string
          trial_identifier: string
          trial_modules?: string[]
          trial_start_date?: string
          trial_status?: string
          trial_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_subscription_id?: string | null
          trial_end_date?: string
          trial_identifier?: string
          trial_modules?: string[]
          trial_start_date?: string
          trial_status?: string
          trial_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_module_access: {
        Row: {
          access_source: string
          expires_at: string | null
          granted_at: string | null
          id: string
          module_id: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          access_source: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          module_id: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          access_source?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          module_id?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string | null
          expires_at: string | null
          id: string
          product_id: string
          started_at: string | null
          status: string
          stripe_subscription_id: string | null
          subscription_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          product_id: string
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          product_id?: string
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_usage_tracking: {
        Row: {
          api_calls_made: number
          contracts_created: number
          created_at: string
          deal_simulations_used: number
          id: string
          month_year: string
          updated_at: string
          user_id: string
          valuations_used: number
        }
        Insert: {
          api_calls_made?: number
          contracts_created?: number
          created_at?: string
          deal_simulations_used?: number
          id?: string
          month_year: string
          updated_at?: string
          user_id: string
          valuations_used?: number
        }
        Update: {
          api_calls_made?: number
          contracts_created?: number
          created_at?: string
          deal_simulations_used?: number
          id?: string
          month_year?: string
          updated_at?: string
          user_id?: string
          valuations_used?: number
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
      workflow_automation_rules: {
        Row: {
          actions: Json
          created_at: string | null
          created_by_user_id: string
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          priority: number | null
          rule_name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json
          created_at?: string | null
          created_by_user_id: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          rule_name: string
          trigger_conditions?: Json
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by_user_id?: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          rule_name?: string
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      writer_allocations: {
        Row: {
          allocated_amount: number
          allocation_type: string
          copyright_id: string
          created_at: string
          id: string
          ownership_percentage: number
          payment_priority: number
          recoupment_applicable: boolean
          sync_license_id: string
          updated_at: string
          writer_id: string
          writer_name: string
        }
        Insert: {
          allocated_amount?: number
          allocation_type?: string
          copyright_id: string
          created_at?: string
          id?: string
          ownership_percentage?: number
          payment_priority?: number
          recoupment_applicable?: boolean
          sync_license_id: string
          updated_at?: string
          writer_id: string
          writer_name: string
        }
        Update: {
          allocated_amount?: number
          allocation_type?: string
          copyright_id?: string
          created_at?: string
          id?: string
          ownership_percentage?: number
          payment_priority?: number
          recoupment_applicable?: boolean
          sync_license_id?: string
          updated_at?: string
          writer_id?: string
          writer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_writer_allocations_copyright"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_writer_allocations_sync_license"
            columns: ["sync_license_id"]
            isOneToOne: false
            referencedRelation: "sync_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_writer_allocations_writer"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      writers: {
        Row: {
          contact_info: Json | null
          created_at: string
          id: string
          original_publisher_id: string
          updated_at: string
          user_id: string
          writer_id: string
          writer_name: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          id?: string
          original_publisher_id: string
          updated_at?: string
          user_id: string
          writer_id: string
          writer_name: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          id?: string
          original_publisher_id?: string
          updated_at?: string
          user_id?: string
          writer_id?: string
          writer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_writers_original_publisher"
            columns: ["original_publisher_id"]
            isOneToOne: false
            referencedRelation: "original_publishers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_client_invitation: {
        Args: { p_accepter: string; p_accepter_email: string; p_token: string }
        Returns: {
          client_user_id: string
          created_at: string
          expires_at: string | null
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["client_role"]
          status: string
          subscriber_user_id: string
          updated_at: string
        }
      }
      add_royalty_source_if_not_exists: {
        Args: { new_source: string }
        Returns: undefined
      }
      calculate_contract_controlled_percentage: {
        Args: { contract_id_param: string }
        Returns: number
      }
      calculate_controlled_share: {
        Args: { copyright_id_param: string }
        Returns: number
      }
      can_manage_operations_team: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      check_contract_payee_connections: {
        Args: { contract_id_param: string }
        Returns: Json
      }
      check_duplicate_sender_code: {
        Args: { p_sender_code: string; p_user_id?: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_block_minutes?: number
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_notification: {
        Args: {
          p_data?: Json
          p_expires_at?: string
          p_message: string
          p_priority?: Database["public"]["Enums"]["notification_priority"]
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      expire_client_access: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      expire_old_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      expire_trials: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_batch_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_copyright_internal_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_op_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_payee_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_royalty_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_royalty_work_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_statement_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sync_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_work_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_writer_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_client_quarterly_balances: {
        Args: Record<PropertyKey, never>
        Returns: {
          agreement_id: string
          closing_balance: number
          contact_name: string
          contract_title: string
          expenses_amount: number
          opening_balance: number
          payments_amount: number
          period_label: string
          quarter: number
          royalties_amount: number
          year: number
        }[]
      }
      get_client_subscriber: {
        Args: { _client_user_id: string }
        Returns: string
      }
      get_invitations_needing_reminders: {
        Args: Record<PropertyKey, never>
        Returns: {
          days_until_expiry: number
          email: string
          expires_at: string
          id: string
          reminder_count: number
          subscriber_user_id: string
        }[]
      }
      get_tenant_by_domain: {
        Args: { domain_name: string }
        Returns: {
          brand_config: Json
          company_info: Json
          created_at: string
          custom_domain: string | null
          enabled_modules: Json
          feature_flags: Json
          id: string
          max_users: number | null
          ssl_enabled: boolean | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string | null
          subscription_tier: string | null
          tenant_name: string
          tenant_slug: string
          updated_at: string
          user_id: string
        }
      }
      get_user_company_role: {
        Args: { company_id_param: string; user_id_param?: string }
        Returns: string
      }
      has_active_trial: {
        Args: { p_modules: string[]; p_user_id: string }
        Returns: boolean
      }
      has_client_portal_access: {
        Args: { _module?: string; _user_id: string }
        Returns: boolean
      }
      has_company_module_access: {
        Args: {
          company_id_param: string
          module_id_param: string
          user_id_param?: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_quarterly_reports_batch: {
        Args: { reports_data: Json }
        Returns: number
      }
      is_operations_team_member: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      link_expenses_to_payout: {
        Args: { payout_id_param: string }
        Returns: undefined
      }
      log_copyright_activity: {
        Args: {
          p_action_type?: string
          p_affected_fields?: string[]
          p_batch_id?: string
          p_copyright_id?: string
          p_ip_address?: string
          p_new_values?: Json
          p_old_values?: Json
          p_operation_details?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_event_data?: Json
          p_event_type?: string
          p_ip_address?: string
          p_severity?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_invitation_reminder_sent: {
        Args: { invitation_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      setup_demo_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      start_free_trial: {
        Args: {
          p_trial_identifier: string
          p_trial_modules: string[]
          p_trial_type: string
          p_user_id: string
        }
        Returns: string
      }
      update_payout_workflow_stage: {
        Args: {
          metadata_param?: Json
          new_stage: string
          payout_id_param: string
          reason_param?: string
        }
        Returns: undefined
      }
      validate_royalty_splits: {
        Args: { contract_id_param: string }
        Returns: {
          is_valid: boolean
          right_type: string
          total_percentage: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      artist_type: "indie" | "label" | "360" | "distribution_only"
      batch_status: "Pending" | "Imported" | "Processed"
      client_role: "admin" | "client"
      contract_status: "draft" | "signed" | "active" | "expired" | "terminated"
      contract_type:
        | "publishing"
        | "artist"
        | "producer"
        | "sync"
        | "distribution"
      controlled_status: "Controlled" | "Non-Controlled"
      notification_priority: "low" | "medium" | "high" | "critical"
      notification_type:
        | "contract_signed"
        | "contract_expiring"
        | "royalty_statement"
        | "payment_processed"
        | "copyright_registered"
        | "sync_opportunity"
        | "system_alert"
        | "security_event"
        | "user_registration"
        | "subscription_change"
        | "document_ready"
        | "contract_pending"
      payment_method: "ACH" | "Wire" | "PayPal" | "Check"
      pro_type: "ASCAP" | "BMI" | "ICE" | "SOCAN" | "PRS" | "OTHER"
      producer_type: "flat_fee" | "points" | "hybrid"
      publishing_type: "admin" | "copub" | "full_pub" | "jv"
      royalty_source:
        | "DSP"
        | "PRO"
        | "YouTube"
        | "Other"
        | "BMI"
        | "ASCAP"
        | "SESAC"
        | "SOCAN"
        | "Spotify"
        | "Apple Music"
        | "Amazon Music"
        | "Tidal"
        | "Pandora"
        | "SiriusXM"
        | "Test Source"
        | "Shondaland"
        | "NBC"
        | "SoundExchange"
        | "NFL Productions"
      sender_code_status: "not_submitted" | "submitted" | "verified"
      sync_type: "one_time" | "mfn" | "perpetual" | "term_limited"
      tenant_status: "active" | "inactive" | "suspended"
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
    Enums: {
      app_role: ["admin", "user"],
      artist_type: ["indie", "label", "360", "distribution_only"],
      batch_status: ["Pending", "Imported", "Processed"],
      client_role: ["admin", "client"],
      contract_status: ["draft", "signed", "active", "expired", "terminated"],
      contract_type: [
        "publishing",
        "artist",
        "producer",
        "sync",
        "distribution",
      ],
      controlled_status: ["Controlled", "Non-Controlled"],
      notification_priority: ["low", "medium", "high", "critical"],
      notification_type: [
        "contract_signed",
        "contract_expiring",
        "royalty_statement",
        "payment_processed",
        "copyright_registered",
        "sync_opportunity",
        "system_alert",
        "security_event",
        "user_registration",
        "subscription_change",
        "document_ready",
        "contract_pending",
      ],
      payment_method: ["ACH", "Wire", "PayPal", "Check"],
      pro_type: ["ASCAP", "BMI", "ICE", "SOCAN", "PRS", "OTHER"],
      producer_type: ["flat_fee", "points", "hybrid"],
      publishing_type: ["admin", "copub", "full_pub", "jv"],
      royalty_source: [
        "DSP",
        "PRO",
        "YouTube",
        "Other",
        "BMI",
        "ASCAP",
        "SESAC",
        "SOCAN",
        "Spotify",
        "Apple Music",
        "Amazon Music",
        "Tidal",
        "Pandora",
        "SiriusXM",
        "Test Source",
        "Shondaland",
        "NBC",
        "SoundExchange",
        "NFL Productions",
      ],
      sender_code_status: ["not_submitted", "submitted", "verified"],
      sync_type: ["one_time", "mfn", "perpetual", "term_limited"],
      tenant_status: ["active", "inactive", "suspended"],
    },
  },
} as const
