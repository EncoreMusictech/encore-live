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
          copyright_id: string | null
          created_at: string
          error_message: string | null
          export_format: string
          export_status: string | null
          export_type: string | null
          file_url: string | null
          id: string
          record_count: number | null
          user_id: string
        }
        Insert: {
          copyright_id?: string | null
          created_at?: string
          error_message?: string | null
          export_format: string
          export_status?: string | null
          export_type?: string | null
          file_url?: string | null
          id?: string
          record_count?: number | null
          user_id: string
        }
        Update: {
          copyright_id?: string | null
          created_at?: string
          error_message?: string | null
          export_format?: string
          export_status?: string | null
          export_type?: string | null
          file_url?: string | null
          id?: string
          record_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copyright_exports_copyright_id_fkey"
            columns: ["copyright_id"]
            isOneToOne: false
            referencedRelation: "copyrights"
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
      payouts: {
        Row: {
          amount_due: number
          client_id: string
          created_at: string
          gross_royalties: number
          id: string
          net_payable: number
          notes: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          payments_to_date: number
          period: string
          period_end: string | null
          period_start: string | null
          royalties_to_date: number
          statement_pdf_url: string | null
          status: string | null
          total_expenses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          client_id: string
          created_at?: string
          gross_royalties?: number
          id?: string
          net_payable?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payments_to_date?: number
          period: string
          period_end?: string | null
          period_start?: string | null
          royalties_to_date?: number
          statement_pdf_url?: string | null
          status?: string | null
          total_expenses?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          client_id?: string
          created_at?: string
          gross_royalties?: number
          id?: string
          net_payable?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          payments_to_date?: number
          period?: string
          period_end?: string | null
          period_start?: string | null
          royalties_to_date?: number
          statement_pdf_url?: string | null
          status?: string | null
          total_expenses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_batches: {
        Row: {
          batch_id: string | null
          created_at: string
          date_received: string
          id: string
          linked_statement_id: string | null
          notes: string | null
          source: Database["public"]["Enums"]["royalty_source"]
          statement_file_url: string | null
          statement_period_end: string | null
          statement_period_start: string | null
          statement_total: number | null
          status: Database["public"]["Enums"]["batch_status"]
          total_gross_amount: number | null
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
          source: Database["public"]["Enums"]["royalty_source"]
          statement_file_url?: string | null
          statement_period_end?: string | null
          statement_period_start?: string | null
          statement_total?: number | null
          status?: Database["public"]["Enums"]["batch_status"]
          total_gross_amount?: number | null
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
          source?: Database["public"]["Enums"]["royalty_source"]
          statement_file_url?: string | null
          statement_period_end?: string | null
          statement_period_start?: string | null
          statement_total?: number | null
          status?: Database["public"]["Enums"]["batch_status"]
          total_gross_amount?: number | null
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
          approval_documentation_url: string | null
          approval_issued: string | null
          check_copy_remittance_url: string | null
          created_at: string
          currency: string | null
          fe_license_returned: boolean | null
          fe_license_url: string | null
          first_confirmation_of_use: string | null
          id: string
          invoice_issued: string | null
          invoice_status: string | null
          invoiced_amount: number | null
          license_issued: string | null
          license_status: string | null
          linked_copyright_ids: string[] | null
          master_fee: number | null
          master_share_percentage: number | null
          master_splits: Json | null
          media_type: string | null
          mfn: boolean | null
          music_type: string | null
          music_use: string | null
          notes: string | null
          payment_received: string | null
          payment_status: string | null
          pe_license_received: string | null
          project_title: string
          pub_fee: number | null
          pub_fee_all_in: number | null
          pub_share_percentage: number | null
          publisher_splits: Json | null
          request_attachment_url: string | null
          request_received: string | null
          royalties: string | null
          smpte: string | null
          source: string | null
          synch_agent: string | null
          synch_id: string
          synch_status: string | null
          term_end: string | null
          term_start: string | null
          territories: string[] | null
          territory_of_licensee: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_documentation_url?: string | null
          approval_issued?: string | null
          check_copy_remittance_url?: string | null
          created_at?: string
          currency?: string | null
          fe_license_returned?: boolean | null
          fe_license_url?: string | null
          first_confirmation_of_use?: string | null
          id?: string
          invoice_issued?: string | null
          invoice_status?: string | null
          invoiced_amount?: number | null
          license_issued?: string | null
          license_status?: string | null
          linked_copyright_ids?: string[] | null
          master_fee?: number | null
          master_share_percentage?: number | null
          master_splits?: Json | null
          media_type?: string | null
          mfn?: boolean | null
          music_type?: string | null
          music_use?: string | null
          notes?: string | null
          payment_received?: string | null
          payment_status?: string | null
          pe_license_received?: string | null
          project_title: string
          pub_fee?: number | null
          pub_fee_all_in?: number | null
          pub_share_percentage?: number | null
          publisher_splits?: Json | null
          request_attachment_url?: string | null
          request_received?: string | null
          royalties?: string | null
          smpte?: string | null
          source?: string | null
          synch_agent?: string | null
          synch_id: string
          synch_status?: string | null
          term_end?: string | null
          term_start?: string | null
          territories?: string[] | null
          territory_of_licensee?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_documentation_url?: string | null
          approval_issued?: string | null
          check_copy_remittance_url?: string | null
          created_at?: string
          currency?: string | null
          fe_license_returned?: boolean | null
          fe_license_url?: string | null
          first_confirmation_of_use?: string | null
          id?: string
          invoice_issued?: string | null
          invoice_status?: string | null
          invoiced_amount?: number | null
          license_issued?: string | null
          license_status?: string | null
          linked_copyright_ids?: string[] | null
          master_fee?: number | null
          master_share_percentage?: number | null
          master_splits?: Json | null
          media_type?: string | null
          mfn?: boolean | null
          music_type?: string | null
          music_use?: string | null
          notes?: string | null
          payment_received?: string | null
          payment_status?: string | null
          pe_license_received?: string | null
          project_title?: string
          pub_fee?: number | null
          pub_fee_all_in?: number | null
          pub_share_percentage?: number | null
          publisher_splits?: Json | null
          request_attachment_url?: string | null
          request_received?: string | null
          royalties?: string | null
          smpte?: string | null
          source?: string | null
          synch_agent?: string | null
          synch_id?: string
          synch_status?: string | null
          term_end?: string | null
          term_start?: string | null
          territories?: string[] | null
          territory_of_licensee?: string | null
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_contract_controlled_percentage: {
        Args: { contract_id_param: string }
        Returns: number
      }
      calculate_controlled_share: {
        Args: { copyright_id_param: string }
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
      log_copyright_activity: {
        Args: {
          p_user_id: string
          p_copyright_id: string
          p_action_type: string
          p_operation_details?: Json
          p_affected_fields?: string[]
          p_old_values?: Json
          p_new_values?: Json
          p_batch_id?: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: string
      }
      setup_demo_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_royalty_splits: {
        Args: { contract_id_param: string }
        Returns: {
          right_type: string
          total_percentage: number
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      artist_type: "indie" | "label" | "360" | "distribution_only"
      batch_status: "Pending" | "Imported" | "Processed"
      contract_status: "draft" | "signed" | "active" | "expired" | "terminated"
      contract_type:
        | "publishing"
        | "artist"
        | "producer"
        | "sync"
        | "distribution"
      controlled_status: "Controlled" | "Non-Controlled"
      payment_method: "ACH" | "Wire" | "PayPal" | "Check"
      producer_type: "flat_fee" | "points" | "hybrid"
      publishing_type: "admin" | "copub" | "full_pub" | "jv"
      royalty_source: "DSP" | "PRO" | "YouTube" | "Other"
      sync_type: "one_time" | "mfn" | "perpetual" | "term_limited"
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
      artist_type: ["indie", "label", "360", "distribution_only"],
      batch_status: ["Pending", "Imported", "Processed"],
      contract_status: ["draft", "signed", "active", "expired", "terminated"],
      contract_type: [
        "publishing",
        "artist",
        "producer",
        "sync",
        "distribution",
      ],
      controlled_status: ["Controlled", "Non-Controlled"],
      payment_method: ["ACH", "Wire", "PayPal", "Check"],
      producer_type: ["flat_fee", "points", "hybrid"],
      publishing_type: ["admin", "copub", "full_pub", "jv"],
      royalty_source: ["DSP", "PRO", "YouTube", "Other"],
      sync_type: ["one_time", "mfn", "perpetual", "term_limited"],
    },
  },
} as const
