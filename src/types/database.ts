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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      brand_identities: {
        Row: {
          brand_id: string
          color_palette: Json | null
          donts: string[] | null
          dos: string[] | null
          id: string
          notes: string | null
          typography: Json | null
          updated_at: string | null
          voice_description: string | null
          voice_examples_bad: string[] | null
          voice_examples_good: string[] | null
        }
        Insert: {
          brand_id: string
          color_palette?: Json | null
          donts?: string[] | null
          dos?: string[] | null
          id?: string
          notes?: string | null
          typography?: Json | null
          updated_at?: string | null
          voice_description?: string | null
          voice_examples_bad?: string[] | null
          voice_examples_good?: string[] | null
        }
        Update: {
          brand_id?: string
          color_palette?: Json | null
          donts?: string[] | null
          dos?: string[] | null
          id?: string
          notes?: string | null
          typography?: Json | null
          updated_at?: string | null
          voice_description?: string | null
          voice_examples_bad?: string[] | null
          voice_examples_good?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_identities_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_logos: {
        Row: {
          brand_id: string
          created_at: string | null
          file_format: string | null
          id: string
          storage_path: string
          updated_at: string | null
          variant: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          file_format?: string | null
          id?: string
          storage_path: string
          updated_at?: string | null
          variant: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          file_format?: string | null
          id?: string
          storage_path?: string
          updated_at?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_logos_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_references: {
        Row: {
          brand_id: string
          created_at: string | null
          external_url: string | null
          id: string
          is_good_example: boolean | null
          notes: string | null
          performance_notes: string | null
          storage_path: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          external_url?: string | null
          id?: string
          is_good_example?: boolean | null
          notes?: string | null
          performance_notes?: string | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          external_url?: string | null
          id?: string
          is_good_example?: boolean | null
          notes?: string | null
          performance_notes?: string | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_references_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          industry: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_comments: {
        Row: {
          body: string
          brief_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          body: string
          brief_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          brief_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_comments_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      briefs: {
        Row: {
          brand_id: string
          concept: string
          copy_body: string
          cost_usd: number | null
          created_at: string | null
          created_by: string | null
          cta: string | null
          format_suggestions: Json | null
          hashtags: string[] | null
          headline: string
          id: string
          model_used: string
          raw_prompt: string | null
          raw_response: string | null
          rejection_reason: string | null
          session_id: string
          status: string
          suggested_stock_ids: string[] | null
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string | null
          visual_brief: Json | null
        }
        Insert: {
          brand_id: string
          concept: string
          copy_body: string
          cost_usd?: number | null
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          format_suggestions?: Json | null
          hashtags?: string[] | null
          headline: string
          id?: string
          model_used: string
          raw_prompt?: string | null
          raw_response?: string | null
          rejection_reason?: string | null
          session_id: string
          status?: string
          suggested_stock_ids?: string[] | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
          visual_brief?: Json | null
        }
        Update: {
          brand_id?: string
          concept?: string
          copy_body?: string
          cost_usd?: number | null
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          format_suggestions?: Json | null
          hashtags?: string[] | null
          headline?: string
          id?: string
          model_used?: string
          raw_prompt?: string | null
          raw_response?: string | null
          rejection_reason?: string | null
          session_id?: string
          status?: string
          suggested_stock_ids?: string[] | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string | null
          visual_brief?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "briefs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "generation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_sessions: {
        Row: {
          brand_id: string
          completed_at: string | null
          error_message: string | null
          extra_notes: string | null
          format_preferences: string[] | null
          id: string
          num_ideas_requested: number
          objective: string
          occasion: string | null
          started_at: string | null
          status: string
          total_cost_usd: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand_id: string
          completed_at?: string | null
          error_message?: string | null
          extra_notes?: string | null
          format_preferences?: string[] | null
          id?: string
          num_ideas_requested: number
          objective: string
          occasion?: string | null
          started_at?: string | null
          status?: string
          total_cost_usd?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          completed_at?: string | null
          error_message?: string | null
          extra_notes?: string | null
          format_preferences?: string[] | null
          id?: string
          num_ideas_requested?: number
          objective?: string
          occasion?: string | null
          started_at?: string | null
          status?: string
          total_cost_usd?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_sessions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_assets: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string | null
          description: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          mime_type: string | null
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
