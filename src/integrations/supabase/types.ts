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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          must_change_password: boolean
          name: string
          password_hash: string
          permissions: string[] | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          name: string
          password_hash: string
          permissions?: string[] | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          name?: string
          password_hash?: string
          permissions?: string[] | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          cnpj: string
          company_name: string
          created_at: string
          id: string
          is_active: boolean
          must_change_password: boolean
          password_hash: string
          updated_at: string
        }
        Insert: {
          cnpj: string
          company_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          password_hash: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          company_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_time: string
          id: string
          identifier: string
          success: boolean
        }
        Insert: {
          attempt_time?: string
          id?: string
          identifier: string
          success?: boolean
        }
        Update: {
          attempt_time?: string
          id?: string
          identifier?: string
          success?: boolean
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          published_at: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          client_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_reset_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_safe"
            referencedColumns: ["id"]
          },
        ]
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
      admin_invites_safe: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string | null
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          used?: boolean | null
        }
        Relationships: []
      }
      admins_safe: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          must_change_password: boolean | null
          name: string | null
          permissions: string[] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          must_change_password?: boolean | null
          name?: string | null
          permissions?: string[] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          must_change_password?: boolean | null
          name?: string | null
          permissions?: string[] | null
        }
        Relationships: []
      }
      clients_safe: {
        Row: {
          cnpj: string | null
          company_name: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          must_change_password: boolean | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          must_change_password?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          must_change_password?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_reset_client_password: {
        Args: { p_client_id: string; p_new_password: string }
        Returns: Json
      }
      can_register_admin: { Args: never; Returns: boolean }
      change_client_password: {
        Args: {
          p_client_id: string
          p_current_password: string
          p_new_password: string
        }
        Returns: Json
      }
      check_admin_invite_token: { Args: { p_token: string }; Returns: Json }
      cleanup_expired_reset_tokens: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      create_admin_invite: { Args: { p_email: string }; Returns: Json }
      create_password_reset_token: { Args: { p_cnpj: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { password: string }; Returns: string }
      reset_client_password_by_cnpj: {
        Args: { p_cnpj: string; p_new_password: string }
        Returns: Json
      }
      use_admin_invite: { Args: { p_invite_id: string }; Returns: boolean }
      validate_admin_invite: {
        Args: { p_email: string; p_token: string }
        Returns: Json
      }
      verify_client_login: {
        Args: { p_cnpj: string; p_password: string }
        Returns: Json
      }
      verify_reset_code_and_change_password: {
        Args: { p_cnpj: string; p_code: string; p_new_password: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
