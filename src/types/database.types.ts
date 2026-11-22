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
    PostgrestVersion: "14.18"
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
      checklist_completions: {
        Row: {
          checklist_item_id: string
          completed_at: string
          photo_url: string | null
          user_id: string
        }
        Insert: {
          checklist_item_id: string
          completed_at?: string
          photo_url?: string | null
          user_id: string
        }
        Update: {
          checklist_item_id?: string
          completed_at?: string
          photo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string
          id: string
          is_checkpoint: boolean
          item_order: number
          item_type: string
          label: string
          sidequest_id: string
          stop_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_checkpoint?: boolean
          item_order?: number
          item_type?: string
          label: string
          sidequest_id: string
          stop_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_checkpoint?: boolean
          item_order?: number
          item_type?: string
          label?: string
          sidequest_id?: string
          stop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_stop_fk"
            columns: ["stop_id", "sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequest_stops"
            referencedColumns: ["id", "sidequest_id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string | null
          university: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug?: string | null
          university?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string | null
          university?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_ratings: {
        Row: {
          created_at: string
          creator_id: string
          rater_id: string
          rating: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          rater_id: string
          rating: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          rater_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "creator_ratings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          address: string | null
          category: string
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          name: string
          nearest_station: string | null
          neighborhood: string | null
          open_late: boolean
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          name: string
          nearest_station?: string | null
          neighborhood?: string | null
          open_late?: boolean
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          name?: string
          nearest_station?: string | null
          neighborhood?: string | null
          open_late?: boolean
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          community_id: string | null
          created_at: string
          display_name: string | null
          id: string
          university: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          community_id?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          university?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          community_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          university?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_url: string
          sidequest_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url: string
          sidequest_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url?: string
          sidequest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_photos_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequest_ratings: {
        Row: {
          created_at: string
          enjoyment_rating: number
          id: string
          memorability_rating: number
          price_rating: number
          review_text: string | null
          sidequest_id: string
          time_rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enjoyment_rating: number
          id?: string
          memorability_rating: number
          price_rating: number
          review_text?: string | null
          sidequest_id: string
          time_rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enjoyment_rating?: number
          id?: string
          memorability_rating?: number
          price_rating?: number
          review_text?: string | null
          sidequest_id?: string
          time_rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidequest_ratings_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sidequest_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequest_stops: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          experience_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          place_name: string
          planned_activity: string | null
          sidequest_id: string
          stop_order: number
          travel_mode_to_stop: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          experience_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name: string
          planned_activity?: string | null
          sidequest_id: string
          stop_order: number
          travel_mode_to_stop?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          experience_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name?: string
          planned_activity?: string | null
          sidequest_id?: string
          stop_order?: number
          travel_mode_to_stop?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sidequest_stops_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sidequest_stops_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequests: {
        Row: {
          category: string | null
          community_id: string | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          estimated_cost: number | null
          estimated_duration_minutes: number | null
          id: string
          is_curated: boolean
          neighborhood: string | null
          primary_line: string | null
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          community_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          estimated_cost?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_curated?: boolean
          neighborhood?: string | null
          primary_line?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          community_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          estimated_cost?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_curated?: boolean
          neighborhood?: string | null
          primary_line?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidequests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sidequests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sidequests: {
        Row: {
          completed_at: string | null
          created_at: string
          sidequest_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          sidequest_id: string
          started_at?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          sidequest_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sidequests_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sidequests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      questgiver_ratings: {
        Row: {
          avg_overall: number | null
          creator_id: string | null
          rating_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sidequests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sidequest_rating_stats: {
        Row: {
          avg_enjoyment: number | null
          avg_memorability: number | null
          avg_overall: number | null
          avg_price: number | null
          avg_time: number | null
          rating_count: number | null
          sidequest_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sidequest_ratings_sidequest_id_fkey"
            columns: ["sidequest_id"]
            isOneToOne: false
            referencedRelation: "sidequests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      save_trail: {
        Args: { p_trail: Json; p_trail_id?: string }
        Returns: string
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
