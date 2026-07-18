export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          active_entity_id: string | null;
          active_entity_type: string | null;
          active_mode: string;
          active_model_part_key: string | null;
          ai_model_used: string | null;
          created_at: string;
          id: string;
          is_emergency: boolean;
          language: string;
          model_selection_id: string | null;
          status: string;
          structure_slug: string | null;
          summary: string | null;
          tissue: Database["public"]["Enums"]["tissue_type"] | null;
          title: string;
          triage_result_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active_entity_id?: string | null;
          active_entity_type?: string | null;
          active_mode?: string;
          active_model_part_key?: string | null;
          ai_model_used?: string | null;
          created_at?: string;
          id?: string;
          is_emergency?: boolean;
          language?: string;
          model_selection_id?: string | null;
          status?: string;
          structure_slug?: string | null;
          summary?: string | null;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
          title?: string;
          triage_result_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active_entity_id?: string | null;
          active_entity_type?: string | null;
          active_mode?: string;
          active_model_part_key?: string | null;
          ai_model_used?: string | null;
          created_at?: string;
          id?: string;
          is_emergency?: boolean;
          language?: string;
          model_selection_id?: string | null;
          status?: string;
          structure_slug?: string | null;
          summary?: string | null;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
          title?: string;
          triage_result_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_conversations_structure_slug_fkey";
            columns: ["structure_slug"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "ai_conversations_structure_slug_fkey";
            columns: ["structure_slug"];
            isOneToOne: false;
            referencedRelation: "model_3d_mappings";
            referencedColumns: ["anatomy_structure_slug"];
          },
        ];
      };
      ai_guardrails: {
        Row: {
          active: boolean;
          category: string;
          fallback_message_en: string | null;
          fallback_message_ro: string | null;
          id: string;
          instruction_en: string | null;
          instruction_ro: string;
          name: string;
          severity_level: string;
        };
        Insert: {
          active?: boolean;
          category?: string;
          fallback_message_en?: string | null;
          fallback_message_ro?: string | null;
          id?: string;
          instruction_en?: string | null;
          instruction_ro: string;
          name: string;
          severity_level?: string;
        };
        Update: {
          active?: boolean;
          category?: string;
          fallback_message_en?: string | null;
          fallback_message_ro?: string | null;
          id?: string;
          instruction_en?: string | null;
          instruction_ro?: string;
          name?: string;
          severity_level?: string;
        };
        Relationships: [];
      };
      ai_knowledge_entries: {
        Row: {
          active: boolean;
          body_region: string | null;
          category: Database["public"]["Enums"]["knowledge_category"];
          content_en: string;
          content_ro: string;
          created_at: string;
          display_name_en: string | null;
          display_name_ro: string | null;
          embedding: string | null;
          embedding_model: string | null;
          embedding_updated_at: string | null;
          id: string;
          metadata: Json;
          model_selection_id: string | null;
          priority: number;
          source_id: string | null;
          structure_slug: string | null;
          tags: string[];
          tissue: Database["public"]["Enums"]["tissue_type"];
          title_en: string;
          title_ro: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          body_region?: string | null;
          category: Database["public"]["Enums"]["knowledge_category"];
          content_en: string;
          content_ro: string;
          created_at?: string;
          display_name_en?: string | null;
          display_name_ro?: string | null;
          embedding?: string | null;
          embedding_model?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          metadata?: Json;
          model_selection_id?: string | null;
          priority?: number;
          source_id?: string | null;
          structure_slug?: string | null;
          tags?: string[];
          tissue: Database["public"]["Enums"]["tissue_type"];
          title_en: string;
          title_ro: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          body_region?: string | null;
          category?: Database["public"]["Enums"]["knowledge_category"];
          content_en?: string;
          content_ro?: string;
          created_at?: string;
          display_name_en?: string | null;
          display_name_ro?: string | null;
          embedding?: string | null;
          embedding_model?: string | null;
          embedding_updated_at?: string | null;
          id?: string;
          metadata?: Json;
          model_selection_id?: string | null;
          priority?: number;
          source_id?: string | null;
          structure_slug?: string | null;
          tags?: string[];
          tissue?: Database["public"]["Enums"]["tissue_type"];
          title_en?: string;
          title_ro?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_entries_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "medical_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_knowledge_entries_structure_slug_fkey";
            columns: ["structure_slug"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "ai_knowledge_entries_structure_slug_fkey";
            columns: ["structure_slug"];
            isOneToOne: false;
            referencedRelation: "model_3d_mappings";
            referencedColumns: ["anatomy_structure_slug"];
          },
        ];
      };
      ai_knowledge_sources: {
        Row: {
          created_at: string;
          evidence_scope: string;
          is_primary: boolean;
          knowledge_entry_id: string;
          review_status: string;
          source_checked_at: string | null;
          source_id: string;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string;
          evidence_scope?: string;
          is_primary?: boolean;
          knowledge_entry_id: string;
          review_status?: string;
          source_checked_at?: string | null;
          source_id: string;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string;
          evidence_scope?: string;
          is_primary?: boolean;
          knowledge_entry_id?: string;
          review_status?: string;
          source_checked_at?: string | null;
          source_id?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_sources_knowledge_entry_id_fkey";
            columns: ["knowledge_entry_id"];
            isOneToOne: false;
            referencedRelation: "ai_knowledge_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_knowledge_sources_knowledge_entry_id_fkey";
            columns: ["knowledge_entry_id"];
            isOneToOne: false;
            referencedRelation: "ai_knowledge_with_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_knowledge_sources_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "medical_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_messages: {
        Row: {
          content_en: string | null;
          content_ro: string | null;
          conversation_id: string;
          created_at: string;
          flagged_by_guardrails: boolean;
          id: string;
          metadata: Json;
          retrieved_context: Json;
          role: Database["public"]["Enums"]["ai_message_role"];
          user_id: string | null;
        };
        Insert: {
          content_en?: string | null;
          content_ro?: string | null;
          conversation_id: string;
          created_at?: string;
          flagged_by_guardrails?: boolean;
          id?: string;
          metadata?: Json;
          retrieved_context?: Json;
          role: Database["public"]["Enums"]["ai_message_role"];
          user_id?: string | null;
        };
        Update: {
          content_en?: string | null;
          content_ro?: string | null;
          conversation_id?: string;
          created_at?: string;
          flagged_by_guardrails?: boolean;
          id?: string;
          metadata?: Json;
          retrieved_context?: Json;
          role?: Database["public"]["Enums"]["ai_message_role"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_rate_limits: {
        Row: {
          action: string;
          request_count: number;
          updated_at: string;
          user_id: string;
          window_start: string;
        };
        Insert: {
          action: string;
          request_count?: number;
          updated_at?: string;
          user_id: string;
          window_start: string;
        };
        Update: {
          action?: string;
          request_count?: number;
          updated_at?: string;
          user_id?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      anatomy_structure_sources: {
        Row: {
          created_at: string;
          evidence_scope: string;
          is_primary: boolean;
          notes_en: string | null;
          notes_ro: string | null;
          review_status: string;
          source_checked_at: string;
          source_id: string;
          structure_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          evidence_scope: string;
          is_primary?: boolean;
          notes_en?: string | null;
          notes_ro?: string | null;
          review_status?: string;
          source_checked_at: string;
          source_id: string;
          structure_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          evidence_scope?: string;
          is_primary?: boolean;
          notes_en?: string | null;
          notes_ro?: string | null;
          review_status?: string;
          source_checked_at?: string;
          source_id?: string;
          structure_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anatomy_structure_sources_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "medical_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "anatomy_structure_sources_structure_id_fkey";
            columns: ["structure_id"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["id"];
          },
        ];
      };
      anatomy_structures: {
        Row: {
          aliases_ro: string[];
          body_region: string;
          common_name_ro: string | null;
          created_at: string;
          description_en: string;
          description_ro: string;
          display_name_en: string | null;
          display_name_ro: string | null;
          english_name: string | null;
          function_en: string;
          function_ro: string;
          id: string;
          latin_name: string | null;
          missing_ro_display_name: boolean;
          model_3d_availability: string;
          model_3d_notes_en: string | null;
          model_3d_notes_ro: string | null;
          model_3d_selectable: boolean;
          model_selection_id: string | null;
          name_latin: string | null;
          name_ro: string;
          parent_slug: string | null;
          popular_name_en: string;
          popular_name_ro: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          subtitle_name: string | null;
          tissue: Database["public"]["Enums"]["tissue_type"];
          updated_at: string;
        };
        Insert: {
          aliases_ro?: string[];
          body_region: string;
          common_name_ro?: string | null;
          created_at?: string;
          description_en: string;
          description_ro?: string;
          display_name_en?: string | null;
          display_name_ro?: string | null;
          english_name?: string | null;
          function_en: string;
          function_ro?: string;
          id?: string;
          latin_name?: string | null;
          missing_ro_display_name?: boolean;
          model_3d_availability?: string;
          model_3d_notes_en?: string | null;
          model_3d_notes_ro?: string | null;
          model_3d_selectable?: boolean;
          model_selection_id?: string | null;
          name_latin?: string | null;
          name_ro: string;
          parent_slug?: string | null;
          popular_name_en: string;
          popular_name_ro: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          subtitle_name?: string | null;
          tissue: Database["public"]["Enums"]["tissue_type"];
          updated_at?: string;
        };
        Update: {
          aliases_ro?: string[];
          body_region?: string;
          common_name_ro?: string | null;
          created_at?: string;
          description_en?: string;
          description_ro?: string;
          display_name_en?: string | null;
          display_name_ro?: string | null;
          english_name?: string | null;
          function_en?: string;
          function_ro?: string;
          id?: string;
          latin_name?: string | null;
          missing_ro_display_name?: boolean;
          model_3d_availability?: string;
          model_3d_notes_en?: string | null;
          model_3d_notes_ro?: string | null;
          model_3d_selectable?: boolean;
          model_selection_id?: string | null;
          name_latin?: string | null;
          name_ro?: string;
          parent_slug?: string | null;
          popular_name_en?: string;
          popular_name_ro?: string;
          scientific_name_en?: string;
          scientific_name_ro?: string;
          slug?: string;
          subtitle_name?: string | null;
          tissue?: Database["public"]["Enums"]["tissue_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anatomy_structures_parent_slug_fkey";
            columns: ["parent_slug"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "anatomy_structures_parent_slug_fkey";
            columns: ["parent_slug"];
            isOneToOne: false;
            referencedRelation: "model_3d_mappings";
            referencedColumns: ["anatomy_structure_slug"];
          },
        ];
      };
      body_regions: {
        Row: {
          created_at: string;
          description_en: string | null;
          description_ro: string;
          id: string;
          latin_name: string | null;
          name_en: string | null;
          name_ro: string;
          popular_name_en: string;
          popular_name_ro: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description_en?: string | null;
          description_ro?: string;
          id?: string;
          latin_name?: string | null;
          name_en?: string | null;
          name_ro: string;
          popular_name_en: string;
          popular_name_ro: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description_en?: string | null;
          description_ro?: string;
          id?: string;
          latin_name?: string | null;
          name_en?: string | null;
          name_ro?: string;
          popular_name_en?: string;
          popular_name_ro?: string;
          scientific_name_en?: string;
          scientific_name_ro?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      condition_medical_reviews: {
        Row: {
          bilingual_status: string;
          condition_id: string;
          created_at: string;
          id: string;
          notes_en: string;
          notes_ro: string;
          primary_source_urls: string[];
          review_version: number;
          reviewed_at: string;
          reviewer_credentials: string | null;
          reviewer_name: string;
          reviewer_type: string;
          source_coverage_status: string;
          terminology_status: string;
          triage_status: string;
          validation_status: string;
        };
        Insert: {
          bilingual_status: string;
          condition_id: string;
          created_at?: string;
          id?: string;
          notes_en: string;
          notes_ro: string;
          primary_source_urls?: string[];
          review_version: number;
          reviewed_at?: string;
          reviewer_credentials?: string | null;
          reviewer_name: string;
          reviewer_type: string;
          source_coverage_status: string;
          terminology_status: string;
          triage_status: string;
          validation_status: string;
        };
        Update: {
          bilingual_status?: string;
          condition_id?: string;
          created_at?: string;
          id?: string;
          notes_en?: string;
          notes_ro?: string;
          primary_source_urls?: string[];
          review_version?: number;
          reviewed_at?: string;
          reviewer_credentials?: string | null;
          reviewer_name?: string;
          reviewer_type?: string;
          source_coverage_status?: string;
          terminology_status?: string;
          triage_status?: string;
          validation_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "condition_medical_reviews_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "condition_evidence_catalog";
            referencedColumns: ["condition_id"];
          },
          {
            foreignKeyName: "condition_medical_reviews_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "conditions";
            referencedColumns: ["id"];
          },
        ];
      };
      condition_sources: {
        Row: {
          condition_id: string;
          created_at: string;
          evidence_reviewed_at: string | null;
          is_primary: boolean;
          notes_en: string | null;
          notes_ro: string | null;
          review_status: string;
          source_checked_at: string | null;
          source_id: string;
          supports_fields: string[];
          verified_at: string | null;
        };
        Insert: {
          condition_id: string;
          created_at?: string;
          evidence_reviewed_at?: string | null;
          is_primary?: boolean;
          notes_en?: string | null;
          notes_ro?: string | null;
          review_status?: string;
          source_checked_at?: string | null;
          source_id: string;
          supports_fields?: string[];
          verified_at?: string | null;
        };
        Update: {
          condition_id?: string;
          created_at?: string;
          evidence_reviewed_at?: string | null;
          is_primary?: boolean;
          notes_en?: string | null;
          notes_ro?: string | null;
          review_status?: string;
          source_checked_at?: string | null;
          source_id?: string;
          supports_fields?: string[];
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "condition_sources_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "condition_evidence_catalog";
            referencedColumns: ["condition_id"];
          },
          {
            foreignKeyName: "condition_sources_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "conditions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "condition_sources_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "medical_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      condition_structures: {
        Row: {
          condition_id: string;
          relevance: number;
          relevance_en: string | null;
          relevance_ro: string | null;
          structure_id: string;
        };
        Insert: {
          condition_id: string;
          relevance?: number;
          relevance_en?: string | null;
          relevance_ro?: string | null;
          structure_id: string;
        };
        Update: {
          condition_id?: string;
          relevance?: number;
          relevance_en?: string | null;
          relevance_ro?: string | null;
          structure_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "condition_structures_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "condition_evidence_catalog";
            referencedColumns: ["condition_id"];
          },
          {
            foreignKeyName: "condition_structures_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "conditions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "condition_structures_structure_id_fkey";
            columns: ["structure_id"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["id"];
          },
        ];
      };
      condition_symptoms: {
        Row: {
          condition_id: string;
          required: boolean;
          symptom_id: string;
          weight: number;
        };
        Insert: {
          condition_id: string;
          required?: boolean;
          symptom_id: string;
          weight?: number;
        };
        Update: {
          condition_id?: string;
          required?: boolean;
          symptom_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "condition_symptoms_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "condition_evidence_catalog";
            referencedColumns: ["condition_id"];
          },
          {
            foreignKeyName: "condition_symptoms_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "conditions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "condition_symptoms_symptom_id_fkey";
            columns: ["symptom_id"];
            isOneToOne: false;
            referencedRelation: "symptoms";
            referencedColumns: ["id"];
          },
        ];
      };
      conditions: {
        Row: {
          active: boolean;
          aliases_en: string[];
          aliases_ro: string[];
          clinician_credentials: string | null;
          clinician_verified_at: string | null;
          clinician_verified_by: string | null;
          common_causes_en: string | null;
          common_causes_ro: string | null;
          condition_category: string;
          created_at: string;
          default_level: Database["public"]["Enums"]["pain_level"];
          description_en: string | null;
          description_ro: string;
          doctor_when_en: string | null;
          doctor_when_ro: string | null;
          educational_note_en: string;
          educational_note_ro: string;
          emergency_signs_en: string | null;
          emergency_signs_ro: string | null;
          icd10_code: string | null;
          id: string;
          keywords_en: string[];
          keywords_ro: string[];
          medical_evidence_reviewed_at: string | null;
          medical_evidence_reviewed_by: string | null;
          medical_review_notes_en: string | null;
          medical_review_notes_ro: string | null;
          medical_validation_status: string;
          name_en: string | null;
          name_ro: string;
          popular_name_en: string | null;
          popular_name_ro: string | null;
          prevention_en: string | null;
          prevention_ro: string | null;
          review_status: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          scientific_name: string | null;
          self_care_en: string | null;
          self_care_ro: string | null;
          slug: string;
          snomed_ct_id: string | null;
          tissue: Database["public"]["Enums"]["tissue_type"];
          triage_priority: number;
          typical_duration_en: string | null;
          typical_duration_ro: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          aliases_en?: string[];
          aliases_ro?: string[];
          clinician_credentials?: string | null;
          clinician_verified_at?: string | null;
          clinician_verified_by?: string | null;
          common_causes_en?: string | null;
          common_causes_ro?: string | null;
          condition_category?: string;
          created_at?: string;
          default_level: Database["public"]["Enums"]["pain_level"];
          description_en?: string | null;
          description_ro: string;
          doctor_when_en?: string | null;
          doctor_when_ro?: string | null;
          educational_note_en?: string;
          educational_note_ro?: string;
          emergency_signs_en?: string | null;
          emergency_signs_ro?: string | null;
          icd10_code?: string | null;
          id?: string;
          keywords_en?: string[];
          keywords_ro?: string[];
          medical_evidence_reviewed_at?: string | null;
          medical_evidence_reviewed_by?: string | null;
          medical_review_notes_en?: string | null;
          medical_review_notes_ro?: string | null;
          medical_validation_status?: string;
          name_en?: string | null;
          name_ro: string;
          popular_name_en?: string | null;
          popular_name_ro?: string | null;
          prevention_en?: string | null;
          prevention_ro?: string | null;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          scientific_name?: string | null;
          self_care_en?: string | null;
          self_care_ro?: string | null;
          slug: string;
          snomed_ct_id?: string | null;
          tissue: Database["public"]["Enums"]["tissue_type"];
          triage_priority?: number;
          typical_duration_en?: string | null;
          typical_duration_ro?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          aliases_en?: string[];
          aliases_ro?: string[];
          clinician_credentials?: string | null;
          clinician_verified_at?: string | null;
          clinician_verified_by?: string | null;
          common_causes_en?: string | null;
          common_causes_ro?: string | null;
          condition_category?: string;
          created_at?: string;
          default_level?: Database["public"]["Enums"]["pain_level"];
          description_en?: string | null;
          description_ro?: string;
          doctor_when_en?: string | null;
          doctor_when_ro?: string | null;
          educational_note_en?: string;
          educational_note_ro?: string;
          emergency_signs_en?: string | null;
          emergency_signs_ro?: string | null;
          icd10_code?: string | null;
          id?: string;
          keywords_en?: string[];
          keywords_ro?: string[];
          medical_evidence_reviewed_at?: string | null;
          medical_evidence_reviewed_by?: string | null;
          medical_review_notes_en?: string | null;
          medical_review_notes_ro?: string | null;
          medical_validation_status?: string;
          name_en?: string | null;
          name_ro?: string;
          popular_name_en?: string | null;
          popular_name_ro?: string | null;
          prevention_en?: string | null;
          prevention_ro?: string | null;
          review_status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          scientific_name?: string | null;
          self_care_en?: string | null;
          self_care_ro?: string | null;
          slug?: string;
          snomed_ct_id?: string | null;
          tissue?: Database["public"]["Enums"]["tissue_type"];
          triage_priority?: number;
          typical_duration_en?: string | null;
          typical_duration_ro?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      internal_organs: {
        Row: {
          action_ro: string;
          body_region: string;
          category_ro: string;
          created_at: string;
          description_ro: string;
          difficulty: string;
          function_ro: string;
          innervation_ro: string;
          insertion_ro: string;
          latin_name: string | null;
          model_selection_id: string;
          name_ro: string;
          origin_ro: string;
          quiz: Json;
          slug: string;
          updated_at: string;
        };
        Insert: {
          action_ro?: string;
          body_region: string;
          category_ro: string;
          created_at?: string;
          description_ro?: string;
          difficulty?: string;
          function_ro?: string;
          innervation_ro?: string;
          insertion_ro?: string;
          latin_name?: string | null;
          model_selection_id: string;
          name_ro: string;
          origin_ro?: string;
          quiz?: Json;
          slug: string;
          updated_at?: string;
        };
        Update: {
          action_ro?: string;
          body_region?: string;
          category_ro?: string;
          created_at?: string;
          description_ro?: string;
          difficulty?: string;
          function_ro?: string;
          innervation_ro?: string;
          insertion_ro?: string;
          latin_name?: string | null;
          model_selection_id?: string;
          name_ro?: string;
          origin_ro?: string;
          quiz?: Json;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medical_sources: {
        Row: {
          active: boolean;
          content_license: string | null;
          content_provider: string | null;
          created_at: string;
          id: string;
          last_verified_at: string | null;
          notes_en: string | null;
          notes_ro: string | null;
          publisher: string | null;
          review_status: string;
          reuse_notes_en: string | null;
          reuse_notes_ro: string | null;
          source_language: string;
          source_type: string;
          title_en: string;
          title_ro: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          active?: boolean;
          content_license?: string | null;
          content_provider?: string | null;
          created_at?: string;
          id?: string;
          last_verified_at?: string | null;
          notes_en?: string | null;
          notes_ro?: string | null;
          publisher?: string | null;
          review_status?: string;
          reuse_notes_en?: string | null;
          reuse_notes_ro?: string | null;
          source_language?: string;
          source_type?: string;
          title_en: string;
          title_ro: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          active?: boolean;
          content_license?: string | null;
          content_provider?: string | null;
          created_at?: string;
          id?: string;
          last_verified_at?: string | null;
          notes_en?: string | null;
          notes_ro?: string | null;
          publisher?: string | null;
          review_status?: string;
          reuse_notes_en?: string | null;
          reuse_notes_ro?: string | null;
          source_language?: string;
          source_type?: string;
          title_en?: string;
          title_ro?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      model_muscle_mappings: {
        Row: {
          active: boolean;
          anatomy_structure_id: string;
          created_at: string;
          display_name_en: string;
          display_name_ro: string;
          entity_type: Database["public"]["Enums"]["anatomical_entity_type"];
          id: string;
          laterality: Database["public"]["Enums"]["anatomical_laterality"];
          latin_name: string | null;
          mapping_confidence: number;
          match_kind: string;
          model_name: string;
          model_selection_id: string;
          muscle_group_id: string | null;
          muscle_id: string | null;
          notes: string;
          popular_name_en: string;
          popular_name_ro: string;
          review_status: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          anatomy_structure_id: string;
          created_at?: string;
          display_name_en: string;
          display_name_ro: string;
          entity_type: Database["public"]["Enums"]["anatomical_entity_type"];
          id?: string;
          laterality: Database["public"]["Enums"]["anatomical_laterality"];
          latin_name?: string | null;
          mapping_confidence?: number;
          match_kind?: string;
          model_name?: string;
          model_selection_id: string;
          muscle_group_id?: string | null;
          muscle_id?: string | null;
          notes?: string;
          popular_name_en: string;
          popular_name_ro: string;
          review_status?: string;
          scientific_name_en: string;
          scientific_name_ro?: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          anatomy_structure_id?: string;
          created_at?: string;
          display_name_en?: string;
          display_name_ro?: string;
          entity_type?: Database["public"]["Enums"]["anatomical_entity_type"];
          id?: string;
          laterality?: Database["public"]["Enums"]["anatomical_laterality"];
          latin_name?: string | null;
          mapping_confidence?: number;
          match_kind?: string;
          model_name?: string;
          model_selection_id?: string;
          muscle_group_id?: string | null;
          muscle_id?: string | null;
          notes?: string;
          popular_name_en?: string;
          popular_name_ro?: string;
          review_status?: string;
          scientific_name_en?: string;
          scientific_name_ro?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "model_muscle_mappings_anatomy_structure_id_fkey";
            columns: ["anatomy_structure_id"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "model_muscle_mappings_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "model_muscle_mappings_muscle_id_fkey";
            columns: ["muscle_id"];
            isOneToOne: false;
            referencedRelation: "muscles";
            referencedColumns: ["id"];
          },
        ];
      };
      movement_patterns: {
        Row: {
          created_at: string;
          description: string;
          description_en: string;
          description_ro: string;
          english_name: string | null;
          id: string;
          name: string;
          name_en: string;
          name_ro: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          description_en: string;
          description_ro: string;
          english_name?: string | null;
          id?: string;
          name: string;
          name_en: string;
          name_ro: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          description_en?: string;
          description_ro?: string;
          english_name?: string | null;
          id?: string;
          name?: string;
          name_en?: string;
          name_ro?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      muscle_groups: {
        Row: {
          body_region_id: string;
          created_at: string;
          description: string;
          description_en: string;
          description_ro: string;
          english_name: string | null;
          id: string;
          latin_name: string | null;
          name: string;
          popular_name_en: string;
          popular_name_ro: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          body_region_id: string;
          created_at?: string;
          description?: string;
          description_en: string;
          description_ro: string;
          english_name?: string | null;
          id?: string;
          latin_name?: string | null;
          name: string;
          popular_name_en: string;
          popular_name_ro: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          body_region_id?: string;
          created_at?: string;
          description?: string;
          description_en?: string;
          description_ro?: string;
          english_name?: string | null;
          id?: string;
          latin_name?: string | null;
          name?: string;
          popular_name_en?: string;
          popular_name_ro?: string;
          scientific_name_en?: string;
          scientific_name_ro?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "muscle_groups_body_region_id_fkey";
            columns: ["body_region_id"];
            isOneToOne: false;
            referencedRelation: "body_regions";
            referencedColumns: ["id"];
          },
        ];
      };
      muscle_movement_patterns: {
        Row: {
          movement_pattern_id: string;
          muscle_id: string;
          role: string;
        };
        Insert: {
          movement_pattern_id: string;
          muscle_id: string;
          role?: string;
        };
        Update: {
          movement_pattern_id?: string;
          muscle_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "muscle_movement_patterns_movement_pattern_id_fkey";
            columns: ["movement_pattern_id"];
            isOneToOne: false;
            referencedRelation: "movement_patterns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "muscle_movement_patterns_muscle_id_fkey";
            columns: ["muscle_id"];
            isOneToOne: false;
            referencedRelation: "muscles";
            referencedColumns: ["id"];
          },
        ];
      };
      muscle_pain_profiles: {
        Row: {
          common_causes: string[];
          common_causes_en: string[];
          common_causes_ro: string[];
          common_symptoms: string[];
          common_symptoms_en: string[];
          common_symptoms_ro: string[];
          created_at: string;
          default_level: Database["public"]["Enums"]["pain_level"];
          educational_note: string;
          educational_note_en: string;
          educational_note_ro: string;
          general_treatment: string[];
          general_treatment_en: string[];
          general_treatment_ro: string[];
          id: string;
          muscle_group_id: string | null;
          muscle_id: string | null;
          prevention: string[];
          prevention_en: string[];
          prevention_ro: string[];
          see_doctor_when: string[];
          see_doctor_when_en: string[];
          see_doctor_when_ro: string[];
          slug: string;
          stop_training_when: string[];
          stop_training_when_en: string[];
          stop_training_when_ro: string[];
          title: string;
          title_en: string;
          title_ro: string;
          updated_at: string;
        };
        Insert: {
          common_causes?: string[];
          common_causes_en: string[];
          common_causes_ro: string[];
          common_symptoms?: string[];
          common_symptoms_en: string[];
          common_symptoms_ro: string[];
          created_at?: string;
          default_level?: Database["public"]["Enums"]["pain_level"];
          educational_note?: string;
          educational_note_en: string;
          educational_note_ro: string;
          general_treatment?: string[];
          general_treatment_en: string[];
          general_treatment_ro: string[];
          id?: string;
          muscle_group_id?: string | null;
          muscle_id?: string | null;
          prevention?: string[];
          prevention_en: string[];
          prevention_ro: string[];
          see_doctor_when?: string[];
          see_doctor_when_en: string[];
          see_doctor_when_ro: string[];
          slug: string;
          stop_training_when?: string[];
          stop_training_when_en: string[];
          stop_training_when_ro: string[];
          title: string;
          title_en: string;
          title_ro: string;
          updated_at?: string;
        };
        Update: {
          common_causes?: string[];
          common_causes_en?: string[];
          common_causes_ro?: string[];
          common_symptoms?: string[];
          common_symptoms_en?: string[];
          common_symptoms_ro?: string[];
          created_at?: string;
          default_level?: Database["public"]["Enums"]["pain_level"];
          educational_note?: string;
          educational_note_en?: string;
          educational_note_ro?: string;
          general_treatment?: string[];
          general_treatment_en?: string[];
          general_treatment_ro?: string[];
          id?: string;
          muscle_group_id?: string | null;
          muscle_id?: string | null;
          prevention?: string[];
          prevention_en?: string[];
          prevention_ro?: string[];
          see_doctor_when?: string[];
          see_doctor_when_en?: string[];
          see_doctor_when_ro?: string[];
          slug?: string;
          stop_training_when?: string[];
          stop_training_when_en?: string[];
          stop_training_when_ro?: string[];
          title?: string;
          title_en?: string;
          title_ro?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "muscle_pain_profiles_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "muscle_pain_profiles_muscle_id_fkey";
            columns: ["muscle_id"];
            isOneToOne: false;
            referencedRelation: "muscles";
            referencedColumns: ["id"];
          },
        ];
      };
      muscles: {
        Row: {
          body_region_id: string;
          created_at: string;
          description: string;
          description_en: string;
          description_ro: string;
          english_name: string | null;
          id: string;
          is_group_label: boolean;
          latin_name: string | null;
          location: string;
          location_en: string;
          location_ro: string;
          muscle_group_id: string;
          name: string;
          popular_name_en: string;
          popular_name_ro: string;
          primary_actions: string[];
          primary_actions_en: string[];
          primary_actions_ro: string[];
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          body_region_id: string;
          created_at?: string;
          description?: string;
          description_en: string;
          description_ro: string;
          english_name?: string | null;
          id?: string;
          is_group_label?: boolean;
          latin_name?: string | null;
          location?: string;
          location_en: string;
          location_ro: string;
          muscle_group_id: string;
          name: string;
          popular_name_en: string;
          popular_name_ro: string;
          primary_actions?: string[];
          primary_actions_en: string[];
          primary_actions_ro: string[];
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          body_region_id?: string;
          created_at?: string;
          description?: string;
          description_en?: string;
          description_ro?: string;
          english_name?: string | null;
          id?: string;
          is_group_label?: boolean;
          latin_name?: string | null;
          location?: string;
          location_en?: string;
          location_ro?: string;
          muscle_group_id?: string;
          name?: string;
          popular_name_en?: string;
          popular_name_ro?: string;
          primary_actions?: string[];
          primary_actions_en?: string[];
          primary_actions_ro?: string[];
          scientific_name_en?: string;
          scientific_name_ro?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "muscles_body_region_id_fkey";
            columns: ["body_region_id"];
            isOneToOne: false;
            referencedRelation: "body_regions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "muscles_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      organ_systems: {
        Row: {
          created_at: string;
          description_en: string;
          description_ro: string;
          id: string;
          name_en: string;
          name_ro: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description_en?: string;
          description_ro?: string;
          id?: string;
          name_en: string;
          name_ro: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description_en?: string;
          description_ro?: string;
          id?: string;
          name_en?: string;
          name_ro?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organs: {
        Row: {
          ai_enabled: boolean;
          aliases_en: string[];
          aliases_ro: string[];
          body_region: string | null;
          common_name_ro: string | null;
          created_at: string;
          description_en: string;
          description_ro: string;
          display_name_ro: string;
          english_name: string | null;
          function_en: string;
          function_ro: string;
          glb_node_name: string | null;
          id: string;
          is_selectable: boolean;
          latin_name: string | null;
          mesh_name: string | null;
          model_key: string | null;
          model_selection_id: string | null;
          organ_system: string | null;
          popular_name_en: string;
          popular_name_ro: string;
          position_status: string;
          risk_category: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          ai_enabled?: boolean;
          aliases_en?: string[];
          aliases_ro?: string[];
          body_region?: string | null;
          common_name_ro?: string | null;
          created_at?: string;
          description_en?: string;
          description_ro?: string;
          display_name_ro: string;
          english_name?: string | null;
          function_en?: string;
          function_ro?: string;
          glb_node_name?: string | null;
          id?: string;
          is_selectable?: boolean;
          latin_name?: string | null;
          mesh_name?: string | null;
          model_key?: string | null;
          model_selection_id?: string | null;
          organ_system?: string | null;
          popular_name_en: string;
          popular_name_ro: string;
          position_status?: string;
          risk_category?: string;
          scientific_name_en: string;
          scientific_name_ro: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          ai_enabled?: boolean;
          aliases_en?: string[];
          aliases_ro?: string[];
          body_region?: string | null;
          common_name_ro?: string | null;
          created_at?: string;
          description_en?: string;
          description_ro?: string;
          display_name_ro?: string;
          english_name?: string | null;
          function_en?: string;
          function_ro?: string;
          glb_node_name?: string | null;
          id?: string;
          is_selectable?: boolean;
          latin_name?: string | null;
          mesh_name?: string | null;
          model_key?: string | null;
          model_selection_id?: string | null;
          organ_system?: string | null;
          popular_name_en?: string;
          popular_name_ro?: string;
          position_status?: string;
          risk_category?: string;
          scientific_name_en?: string;
          scientific_name_ro?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organs_organ_system_fkey";
            columns: ["organ_system"];
            isOneToOne: false;
            referencedRelation: "organ_systems";
            referencedColumns: ["slug"];
          },
        ];
      };
      pain_classifications: {
        Row: {
          created_at: string;
          description: string;
          description_en: string;
          description_ro: string;
          level: Database["public"]["Enums"]["pain_level"];
          name: string;
          name_en: string;
          name_ro: string;
          recommendations: string[];
          recommendations_en: string[];
          recommendations_ro: string[];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          description_en: string;
          description_ro: string;
          level: Database["public"]["Enums"]["pain_level"];
          name: string;
          name_en: string;
          name_ro: string;
          recommendations?: string[];
          recommendations_en: string[];
          recommendations_ro: string[];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          description_en?: string;
          description_ro?: string;
          level?: Database["public"]["Enums"]["pain_level"];
          name?: string;
          name_en?: string;
          name_ro?: string;
          recommendations?: string[];
          recommendations_en?: string[];
          recommendations_ro?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      symptoms: {
        Row: {
          created_at: string;
          description_en: string;
          description_ro: string;
          id: string;
          keywords_en: string[];
          keywords_ro: string[];
          name_en: string;
          name_ro: string;
          red_flag: boolean;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description_en: string;
          description_ro?: string;
          id?: string;
          keywords_en?: string[];
          keywords_ro?: string[];
          name_en: string;
          name_ro: string;
          red_flag?: boolean;
          slug: string;
        };
        Update: {
          created_at?: string;
          description_en?: string;
          description_ro?: string;
          id?: string;
          keywords_en?: string[];
          keywords_ro?: string[];
          name_en?: string;
          name_ro?: string;
          red_flag?: boolean;
          slug?: string;
        };
        Relationships: [];
      };
      triage_options: {
        Row: {
          finding_en: string;
          finding_ro: string | null;
          id: string;
          label_en: string;
          label_ro: string;
          option_key: string;
          question_id: string;
          score_consultare_doctor: number;
          score_mediu: number;
          score_usor: number;
          sort_order: number;
        };
        Insert: {
          finding_en: string;
          finding_ro?: string | null;
          id?: string;
          label_en: string;
          label_ro: string;
          option_key: string;
          question_id: string;
          score_consultare_doctor?: number;
          score_mediu?: number;
          score_usor?: number;
          sort_order?: number;
        };
        Update: {
          finding_en?: string;
          finding_ro?: string | null;
          id?: string;
          label_en?: string;
          label_ro?: string;
          option_key?: string;
          question_id?: string;
          score_consultare_doctor?: number;
          score_mediu?: number;
          score_usor?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "triage_options_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "triage_questions";
            referencedColumns: ["id"];
          },
        ];
      };
      triage_questions: {
        Row: {
          active: boolean;
          body_region: string | null;
          id: string;
          kind: Database["public"]["Enums"]["question_kind"];
          question_en: string;
          question_ro: string;
          slug: string;
          sort_order: number;
          tissue: Database["public"]["Enums"]["tissue_type"] | null;
        };
        Insert: {
          active?: boolean;
          body_region?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["question_kind"];
          question_en: string;
          question_ro: string;
          slug: string;
          sort_order?: number;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
        };
        Update: {
          active?: boolean;
          body_region?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["question_kind"];
          question_en?: string;
          question_ro?: string;
          slug?: string;
          sort_order?: number;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
        };
        Relationships: [];
      };
      triage_rules: {
        Row: {
          body_region: string | null;
          condition_id: string | null;
          explanation_en: string;
          explanation_ro: string;
          id: string;
          level: Database["public"]["Enums"]["pain_level"];
          name_en: string;
          name_ro: string;
          priority: number;
          rule: Json;
          slug: string;
          tissue: Database["public"]["Enums"]["tissue_type"] | null;
        };
        Insert: {
          body_region?: string | null;
          condition_id?: string | null;
          explanation_en: string;
          explanation_ro: string;
          id?: string;
          level: Database["public"]["Enums"]["pain_level"];
          name_en: string;
          name_ro: string;
          priority?: number;
          rule: Json;
          slug: string;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
        };
        Update: {
          body_region?: string | null;
          condition_id?: string | null;
          explanation_en?: string;
          explanation_ro?: string;
          id?: string;
          level?: Database["public"]["Enums"]["pain_level"];
          name_en?: string;
          name_ro?: string;
          priority?: number;
          rule?: Json;
          slug?: string;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "triage_rules_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "condition_evidence_catalog";
            referencedColumns: ["condition_id"];
          },
          {
            foreignKeyName: "triage_rules_condition_id_fkey";
            columns: ["condition_id"];
            isOneToOne: false;
            referencedRelation: "conditions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      ai_knowledge_with_sources: {
        Row: {
          active: boolean | null;
          body_region: string | null;
          category: Database["public"]["Enums"]["knowledge_category"] | null;
          content_en: string | null;
          content_ro: string | null;
          created_at: string | null;
          display_name_en: string | null;
          display_name_ro: string | null;
          embedding: string | null;
          embedding_model: string | null;
          embedding_updated_at: string | null;
          id: string | null;
          metadata: Json | null;
          model_selection_id: string | null;
          priority: number | null;
          source_id: string | null;
          sources: Json | null;
          structure_slug: string | null;
          tags: string[] | null;
          tissue: Database["public"]["Enums"]["tissue_type"] | null;
          title_en: string | null;
          title_ro: string | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          body_region?: string | null;
          category?: Database["public"]["Enums"]["knowledge_category"] | null;
          content_en?: string | null;
          content_ro?: string | null;
          created_at?: string | null;
          display_name_en?: string | null;
          display_name_ro?: string | null;
          embedding?: string | null;
          embedding_model?: string | null;
          embedding_updated_at?: string | null;
          id?: string | null;
          metadata?: Json | null;
          model_selection_id?: string | null;
          priority?: number | null;
          source_id?: string | null;
          sources?: never;
          structure_slug?: string | null;
          tags?: string[] | null;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
          title_en?: string | null;
          title_ro?: string | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          body_region?: string | null;
          category?: Database["public"]["Enums"]["knowledge_category"] | null;
          content_en?: string | null;
          content_ro?: string | null;
          created_at?: string | null;
          display_name_en?: string | null;
          display_name_ro?: string | null;
          embedding?: string | null;
          embedding_model?: string | null;
          embedding_updated_at?: string | null;
          id?: string | null;
          metadata?: Json | null;
          model_selection_id?: string | null;
          priority?: number | null;
          source_id?: string | null;
          sources?: never;
          structure_slug?: string | null;
          tags?: string[] | null;
          tissue?: Database["public"]["Enums"]["tissue_type"] | null;
          title_en?: string | null;
          title_ro?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_entries_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "medical_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_knowledge_entries_structure_slug_fkey";
            columns: ["structure_slug"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "ai_knowledge_entries_structure_slug_fkey";
            columns: ["structure_slug"];
            isOneToOne: false;
            referencedRelation: "model_3d_mappings";
            referencedColumns: ["anatomy_structure_slug"];
          },
        ];
      };
      anatomy_name_catalog: {
        Row: {
          entity_id: string | null;
          entity_type: string | null;
          latin_name: string | null;
          model_selection_id: string | null;
          popular_name_en: string | null;
          popular_name_ro: string | null;
          scientific_name_en: string | null;
          scientific_name_ro: string | null;
          slug: string | null;
          source_table: string | null;
        };
        Relationships: [];
      };
      condition_evidence_catalog: {
        Row: {
          clinically_verified_source_count: number | null;
          condition_id: string | null;
          condition_slug: string | null;
          name_en: string | null;
          name_ro: string | null;
          primary_source_count: number | null;
          source_count: number | null;
          sources: Json | null;
        };
        Relationships: [];
      };
      DictionarBazaDate: {
        Row: {
          categorie: string | null;
          numeRomanesc: string | null;
          numeTehnic: string | null;
          ordine: number | null;
          rolInSantix: string | null;
          tipObiect: string | null;
        };
        Relationships: [];
      };
      model_3d_mappings: {
        Row: {
          active: boolean | null;
          anatomy_structure_id: string | null;
          anatomy_structure_name_en: string | null;
          anatomy_structure_name_ro: string | null;
          anatomy_structure_slug: string | null;
          created_at: string | null;
          display_name_en: string | null;
          display_name_ro: string | null;
          entity_id: string | null;
          entity_type: Database["public"]["Enums"]["anatomical_entity_type"] | null;
          id: string | null;
          laterality: Database["public"]["Enums"]["anatomical_laterality"] | null;
          latin_name: string | null;
          mapping_confidence: number | null;
          match_kind: string | null;
          mesh_name: string | null;
          model_name: string | null;
          model_part_key: string | null;
          muscle_group_id: string | null;
          muscle_id: string | null;
          notes: string | null;
          popular_name_en: string | null;
          popular_name_ro: string | null;
          review_status: string | null;
          scientific_name_en: string | null;
          scientific_name_ro: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "model_muscle_mappings_anatomy_structure_id_fkey";
            columns: ["anatomy_structure_id"];
            isOneToOne: false;
            referencedRelation: "anatomy_structures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "model_muscle_mappings_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "model_muscle_mappings_muscle_id_fkey";
            columns: ["muscle_id"];
            isOneToOne: false;
            referencedRelation: "muscles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      auth_email_exists: { Args: { p_email: string }; Returns: boolean };
      check_ai_rate_limit: {
        Args: { p_action: string; p_limit?: number; p_window_seconds?: number };
        Returns: Json;
      };
      delete_current_new_google_user: { Args: never; Returns: boolean };
      get_ai_context_for_selection: {
        Args: {
          p_body_region?: string;
          p_limit?: number;
          p_model_selection_id?: string;
          p_structure_slug?: string;
          p_tissue: Database["public"]["Enums"]["tissue_type"];
        };
        Returns: {
          body_region: string;
          category: Database["public"]["Enums"]["knowledge_category"];
          content_en: string;
          content_ro: string;
          id: string;
          metadata: Json;
          model_selection_id: string;
          priority: number;
          sources: Json;
          structure_slug: string;
          tags: string[];
          tissue: Database["public"]["Enums"]["tissue_type"];
          title_en: string;
          title_ro: string;
        }[];
      };
      get_model_part_medical_context: {
        Args: { p_model_part_key: string };
        Returns: {
          anatomy_structure_name_ro: string;
          anatomy_structure_slug: string;
          conditions: Json;
          entity_type: Database["public"]["Enums"]["anatomical_entity_type"];
          laterality: Database["public"]["Enums"]["anatomical_laterality"];
          model_part_key: string;
          popular_name_en: string;
          popular_name_ro: string;
          scientific_name_en: string;
          scientific_name_ro: string;
        }[];
      };
      list_missing_romanian_display_names: {
        Args: never;
        Returns: {
          common_name_ro: string;
          display_name_ro: string;
          english_name: string;
          id: string;
          missing_ro_display_name: boolean;
          model_selection_id: string;
          name_ro: string;
          slug: string;
          tissue: Database["public"]["Enums"]["tissue_type"];
        }[];
      };
      match_ai_knowledge_entries: {
        Args: {
          p_ai_layer?: string;
          p_body_region?: string;
          p_categories?: Database["public"]["Enums"]["knowledge_category"][];
          p_match_count?: number;
          p_match_threshold?: number;
          p_query_embedding: string;
          p_structure_slug?: string;
          p_tags?: string[];
        };
        Returns: {
          body_region: string;
          category: Database["public"]["Enums"]["knowledge_category"];
          content_en: string;
          content_ro: string;
          display_name_en: string;
          display_name_ro: string;
          id: string;
          metadata: Json;
          model_selection_id: string;
          priority: number;
          similarity: number;
          sources: Json;
          structure_slug: string;
          tags: string[];
          tissue: Database["public"]["Enums"]["tissue_type"];
          title_en: string;
          title_ro: string;
        }[];
      };
      model_part_display_name_en: {
        Args: { p_model_part_key: string };
        Returns: string;
      };
    };
    Enums: {
      ai_message_role: "user" | "assistant" | "system";
      anatomical_entity_type: "muscle" | "muscle_group" | "bone" | "organ" | "ligament" | "tendon";
      anatomical_laterality: "left" | "right" | "midline" | "bilateral" | "unspecified";
      knowledge_category:
        | "anatomie"
        | "simptome"
        | "cauze_posibile"
        | "recomandari"
        | "semne_alarma"
        | "intrebari_clarificare";
      pain_level: "usor" | "mediu" | "consultare_doctor";
      question_kind: "single_choice" | "multi_choice" | "number" | "text";
      tissue_type: "os" | "muschi" | "tendon" | "nerv" | "organ" | "articulatie";
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_message_role: ["user", "assistant", "system"],
      anatomical_entity_type: ["muscle", "muscle_group", "bone", "organ", "ligament", "tendon"],
      anatomical_laterality: ["left", "right", "midline", "bilateral", "unspecified"],
      knowledge_category: [
        "anatomie",
        "simptome",
        "cauze_posibile",
        "recomandari",
        "semne_alarma",
        "intrebari_clarificare",
      ],
      pain_level: ["usor", "mediu", "consultare_doctor"],
      question_kind: ["single_choice", "multi_choice", "number", "text"],
      tissue_type: ["os", "muschi", "tendon", "nerv", "organ", "articulatie"],
    },
  },
} as const;
