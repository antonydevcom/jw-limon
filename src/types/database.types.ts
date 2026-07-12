export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cleaning_assignments: {
        Row: {
          cleaning_group_name: string | null
          congregation_id: string
          created_at: string
          id: string
          notes: string | null
          period_id: string
          service_date: string
          updated_at: string
        }
        Insert: {
          cleaning_group_name?: string | null
          congregation_id: string
          created_at?: string
          id?: string
          notes?: string | null
          period_id: string
          service_date: string
          updated_at?: string
        }
        Update: {
          cleaning_group_name?: string | null
          congregation_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          period_id?: string
          service_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_assignments_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_assignments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      congregation_events: {
        Row: {
          congregation_id: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          congregation_id: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "congregation_events_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      congregation_memberships: {
        Row: {
          congregation_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          congregation_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          congregation_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "congregation_memberships_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      congregations: {
        Row: {
          accent_color: string | null
          created_at: string
          display_name: string
          id: string
          midweek_day: number | null
          midweek_time: string | null
          name: string
          settings: Json
          short_name: string
          updated_at: string
          weekend_day: number | null
          weekend_time: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          display_name: string
          id?: string
          midweek_day?: number | null
          midweek_time?: string | null
          name: string
          settings?: Json
          short_name: string
          updated_at?: string
          weekend_day?: number | null
          weekend_time?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          display_name?: string
          id?: string
          midweek_day?: number | null
          midweek_time?: string | null
          name?: string
          settings?: Json
          short_name?: string
          updated_at?: string
          weekend_day?: number | null
          weekend_time?: string | null
        }
        Relationships: []
      }
      duty_assignments: {
        Row: {
          auditorium_name: string | null
          congregation_id: string
          created_at: string
          entrance_name: string | null
          id: string
          meeting_date: string
          microphone_1_name: string | null
          microphone_2_name: string | null
          period_id: string
          updated_at: string
        }
        Insert: {
          auditorium_name?: string | null
          congregation_id: string
          created_at?: string
          entrance_name?: string | null
          id?: string
          meeting_date: string
          microphone_1_name?: string | null
          microphone_2_name?: string | null
          period_id: string
          updated_at?: string
        }
        Update: {
          auditorium_name?: string | null
          congregation_id?: string
          created_at?: string
          entrance_name?: string | null
          id?: string
          meeting_date?: string
          microphone_1_name?: string | null
          microphone_2_name?: string | null
          period_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_assignments_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_assignments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      field_service_schedule: {
        Row: {
          captain_name: string | null
          congregation_id: string
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          starts_at: string | null
          time_slot: Database["public"]["Enums"]["time_slot"]
          updated_at: string
          weekday: number
        }
        Insert: {
          captain_name?: string | null
          congregation_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          starts_at?: string | null
          time_slot: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
          weekday: number
        }
        Update: {
          captain_name?: string | null
          congregation_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          starts_at?: string | null
          time_slot?: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "field_service_schedule_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitality_assignments: {
        Row: {
          congregation_id: string
          created_at: string
          group_name: string | null
          id: string
          meeting_date: string
          notes: string | null
          period_id: string
          updated_at: string
        }
        Insert: {
          congregation_id: string
          created_at?: string
          group_name?: string | null
          id?: string
          meeting_date: string
          notes?: string | null
          period_id: string
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          created_at?: string
          group_name?: string | null
          id?: string
          meeting_date?: string
          notes?: string | null
          period_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospitality_assignments_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitality_assignments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      midweek_meetings: {
        Row: {
          chairman_name: string | null
          closing_prayer_name: string | null
          closing_song: string | null
          congregation_id: string
          created_at: string
          id: string
          is_canceled: boolean
          meeting_date: string
          mid_song: string | null
          notes: string | null
          opening_prayer_name: string | null
          opening_song: string | null
          period_id: string
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
        }
        Insert: {
          chairman_name?: string | null
          closing_prayer_name?: string | null
          closing_song?: string | null
          congregation_id: string
          created_at?: string
          id?: string
          is_canceled?: boolean
          meeting_date: string
          mid_song?: string | null
          notes?: string | null
          opening_prayer_name?: string | null
          opening_song?: string | null
          period_id: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Update: {
          chairman_name?: string | null
          closing_prayer_name?: string | null
          closing_song?: string | null
          congregation_id?: string
          created_at?: string
          id?: string
          is_canceled?: boolean
          meeting_date?: string
          mid_song?: string | null
          notes?: string | null
          opening_prayer_name?: string | null
          opening_song?: string | null
          period_id?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "midweek_meetings_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "midweek_meetings_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      midweek_parts: {
        Row: {
          assigned_name: string | null
          assistant_name: string | null
          congregation_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_id: string
          section: Database["public"]["Enums"]["midweek_section"]
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          assigned_name?: string | null
          assistant_name?: string | null
          congregation_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_id: string
          section: Database["public"]["Enums"]["midweek_section"]
          sort_order: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          assigned_name?: string | null
          assistant_name?: string | null
          congregation_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_id?: string
          section?: Database["public"]["Enums"]["midweek_section"]
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "midweek_parts_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "midweek_parts_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "midweek_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accent_preference: string | null
          created_at: string
          full_name: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_preference?: string | null
          created_at?: string
          full_name?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_preference?: string | null
          created_at?: string
          full_name?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reader_assignments: {
        Row: {
          congregation_id: string
          created_at: string
          id: string
          meeting_date: string
          notes: string | null
          period_id: string
          reader_name: string | null
          reader_type: Database["public"]["Enums"]["reader_type"]
          updated_at: string
        }
        Insert: {
          congregation_id: string
          created_at?: string
          id?: string
          meeting_date: string
          notes?: string | null
          period_id: string
          reader_name?: string | null
          reader_type: Database["public"]["Enums"]["reader_type"]
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          created_at?: string
          id?: string
          meeting_date?: string
          notes?: string | null
          period_id?: string
          reader_name?: string | null
          reader_type?: Database["public"]["Enums"]["reader_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reader_assignments_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reader_assignments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_periods: {
        Row: {
          congregation_id: string
          created_at: string
          ends_on: string
          id: string
          notes: string | null
          published_at: string | null
          starts_on: string
          status: Database["public"]["Enums"]["schedule_status"]
          template_key: Database["public"]["Enums"]["schedule_template_key"]
          updated_at: string
        }
        Insert: {
          congregation_id: string
          created_at?: string
          ends_on: string
          id?: string
          notes?: string | null
          published_at?: string | null
          starts_on: string
          status?: Database["public"]["Enums"]["schedule_status"]
          template_key: Database["public"]["Enums"]["schedule_template_key"]
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          notes?: string | null
          published_at?: string | null
          starts_on?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          template_key?: Database["public"]["Enums"]["schedule_template_key"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_periods_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      weekend_meetings: {
        Row: {
          chairman_name: string | null
          congregation_id: string
          created_at: string
          hospitality_group_name: string | null
          id: string
          is_special_event: boolean
          meeting_date: string
          notes: string | null
          opening_prayer_name: string | null
          outline_title: string | null
          period_id: string
          song_number: string | null
          speaker_congregation: string | null
          speaker_name: string | null
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
          wt_conductor_name: string | null
          wt_reader_name: string | null
        }
        Insert: {
          chairman_name?: string | null
          congregation_id: string
          created_at?: string
          hospitality_group_name?: string | null
          id?: string
          is_special_event?: boolean
          meeting_date: string
          notes?: string | null
          opening_prayer_name?: string | null
          outline_title?: string | null
          period_id: string
          song_number?: string | null
          speaker_congregation?: string | null
          speaker_name?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          wt_conductor_name?: string | null
          wt_reader_name?: string | null
        }
        Update: {
          chairman_name?: string | null
          congregation_id?: string
          created_at?: string
          hospitality_group_name?: string | null
          id?: string
          is_special_event?: boolean
          meeting_date?: string
          notes?: string | null
          opening_prayer_name?: string | null
          outline_title?: string | null
          period_id?: string
          song_number?: string | null
          speaker_congregation?: string | null
          speaker_name?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          wt_conductor_name?: string | null
          wt_reader_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekend_meetings_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekend_meetings_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_over_user: { Args: { target_user_id: string }; Returns: boolean }
      is_congregation_admin: {
        Args: { target_congregation_id: string }
        Returns: boolean
      }
      is_congregation_member: {
        Args: { target_congregation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
      midweek_section: "treasures" | "ministry" | "living"
      reader_type: "watchtower_study" | "congregation_bible_study"
      schedule_status: "draft" | "published" | "archived"
      schedule_template_key:
        | "midweek"
        | "weekend"
        | "readers"
        | "duties"
        | "cleaning"
        | "hospitality"
      time_slot: "morning" | "afternoon"
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "viewer"],
      midweek_section: ["treasures", "ministry", "living"],
      reader_type: ["watchtower_study", "congregation_bible_study"],
      schedule_status: ["draft", "published", "archived"],
      schedule_template_key: [
        "midweek",
        "weekend",
        "readers",
        "duties",
        "cleaning",
        "hospitality",
      ],
      time_slot: ["morning", "afternoon"],
    },
  },
} as const
