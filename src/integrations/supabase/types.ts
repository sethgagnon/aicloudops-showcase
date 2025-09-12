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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          meta: Json | null
          path: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          meta?: Json | null
          path: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          meta?: Json | null
          path?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          os: string | null
          path: string
          referrer: string | null
          referrer_domain: string | null
          region: string | null
          session_id: string
          title: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          os?: string | null
          path: string
          referrer?: string | null
          referrer_domain?: string | null
          region?: string | null
          session_id: string
          title?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          os?: string | null
          path?: string
          referrer?: string | null
          referrer_domain?: string | null
          region?: string | null
          session_id?: string
          title?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      contact_access_logs: {
        Row: {
          accessed_at: string
          action: string
          contact_id: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          contact_id?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          contact_id?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_security_audit: {
        Row: {
          action: string
          created_at: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          sensitive_fields_accessed: string[] | null
          success: boolean | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          sensitive_fields_accessed?: string[] | null
          success?: boolean | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          sensitive_fields_accessed?: string[] | null
          success?: boolean | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_suggestions: {
        Row: {
          applied_at: string | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          id: string
          original_text: string | null
          post_id: string | null
          status: string
          suggested_text: string
          suggestion_type: string
        }
        Insert: {
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          original_text?: string | null
          post_id?: string | null
          status?: string
          suggested_text: string
          suggestion_type: string
        }
        Update: {
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          original_text?: string | null
          post_id?: string | null
          status?: string
          suggested_text?: string
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_suggestions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_tracking: {
        Row: {
          created_at: string
          difficulty_score: number | null
          id: string
          keyword: string
          opportunity_score: number | null
          position: number | null
          search_volume: number | null
          tracked_by: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          difficulty_score?: number | null
          id?: string
          keyword: string
          opportunity_score?: number | null
          position?: number | null
          search_volume?: number | null
          tracked_by?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          difficulty_score?: number | null
          id?: string
          keyword?: string
          opportunity_score?: number | null
          position?: number | null
          search_volume?: number | null
          tracked_by?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string | null
          voter_ip: unknown | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id?: string | null
          voter_ip?: unknown | null
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string | null
          voter_ip?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          ai_generated: boolean
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          linkedin_content: string | null
          linkedin_post_id: string | null
          linkedin_posted_at: string | null
          options: Json
          scheduled_at: string | null
          status: string
          title: string
          total_votes: number
          updated_at: string
          week_of: string
        }
        Insert: {
          ai_generated?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          linkedin_content?: string | null
          linkedin_post_id?: string | null
          linkedin_posted_at?: string | null
          options?: Json
          scheduled_at?: string | null
          status?: string
          title: string
          total_votes?: number
          updated_at?: string
          week_of?: string
        }
        Update: {
          ai_generated?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          linkedin_content?: string | null
          linkedin_post_id?: string | null
          linkedin_posted_at?: string | null
          options?: Json
          scheduled_at?: string | null
          status?: string
          title?: string
          total_votes?: number
          updated_at?: string
          week_of?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          scheduled_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          scheduled_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          scheduled_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_analysis: {
        Row: {
          analyzed_by: string | null
          content: string | null
          content_score: number | null
          created_at: string
          id: string
          keyword_density: Json | null
          meta_description: string | null
          meta_description_score: number | null
          seo_score: number | null
          structured_data: Json | null
          suggestions: Json | null
          title: string | null
          title_score: number | null
          updated_at: string
          url: string
        }
        Insert: {
          analyzed_by?: string | null
          content?: string | null
          content_score?: number | null
          created_at?: string
          id?: string
          keyword_density?: Json | null
          meta_description?: string | null
          meta_description_score?: number | null
          seo_score?: number | null
          structured_data?: Json | null
          suggestions?: Json | null
          title?: string | null
          title_score?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          analyzed_by?: string | null
          content?: string | null
          content_score?: number | null
          created_at?: string
          id?: string
          keyword_density?: Json | null
          meta_description?: string | null
          meta_description_score?: number | null
          seo_score?: number | null
          structured_data?: Json | null
          suggestions?: Json | null
          title?: string | null
          title_score?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      seo_change_history: {
        Row: {
          applied_at: string
          applied_by: string
          can_undo: boolean
          diff: string | null
          field_name: string
          id: string
          issue_id: string | null
          new_value: string
          old_value: string | null
          page_id: string
          page_type: string
          selector: string | null
        }
        Insert: {
          applied_at?: string
          applied_by: string
          can_undo?: boolean
          diff?: string | null
          field_name: string
          id?: string
          issue_id?: string | null
          new_value: string
          old_value?: string | null
          page_id: string
          page_type: string
          selector?: string | null
        }
        Update: {
          applied_at?: string
          applied_by?: string
          can_undo?: boolean
          diff?: string | null
          field_name?: string
          id?: string
          issue_id?: string | null
          new_value?: string
          old_value?: string | null
          page_id?: string
          page_type?: string
          selector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_change_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "seo_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_issues: {
        Row: {
          category: string
          created_at: string
          current_value: string | null
          id: string
          proposed_fix: string
          report_id: string
          severity: string
          status: string
          title: string
          updated_at: string
          where_example: string | null
          where_field: string
          where_selector: string | null
          why: string
        }
        Insert: {
          category: string
          created_at?: string
          current_value?: string | null
          id?: string
          proposed_fix: string
          report_id: string
          severity: string
          status?: string
          title: string
          updated_at?: string
          where_example?: string | null
          where_field: string
          where_selector?: string | null
          why: string
        }
        Update: {
          category?: string
          created_at?: string
          current_value?: string | null
          id?: string
          proposed_fix?: string
          report_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          where_example?: string | null
          where_field?: string
          where_selector?: string | null
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_issues_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "seo_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_reports: {
        Row: {
          analyzed_by: string
          content: string | null
          created_at: string
          generated_at: string
          id: string
          page_id: string
          page_type: string
          summary: Json
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          analyzed_by: string
          content?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          page_id: string
          page_type: string
          summary?: Json
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          analyzed_by?: string
          content?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          page_id?: string
          page_type?: string
          summary?: Json
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      static_pages: {
        Row: {
          canonical: string | null
          created_at: string
          id: string
          keywords: string | null
          meta_description: string | null
          og_image: string | null
          og_type: string | null
          path: string
          structured_data: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          canonical?: string | null
          created_at?: string
          id?: string
          keywords?: string | null
          meta_description?: string | null
          og_image?: string | null
          og_type?: string | null
          path: string
          structured_data?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          canonical?: string | null
          created_at?: string
          id?: string
          keywords?: string | null
          meta_description?: string | null
          og_image?: string | null
          og_type?: string | null
          path?: string
          structured_data?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: {
        Args: { title: string }
        Returns: string
      }
      get_contacts_masked: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
        }[]
      }
      get_security_incidents: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          failure_reason: string
          incident_count: number
          incident_time: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_secure: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_contact_access: {
        Args: { _action: string; _user_id: string }
        Returns: boolean
      }
      validate_contact_submission: {
        Args: { _email: string; _ip?: unknown; _message: string; _name: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "support" | "user"
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
      app_role: ["admin", "support", "user"],
    },
  },
} as const
