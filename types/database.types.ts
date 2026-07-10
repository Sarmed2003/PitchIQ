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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          context: string
          created_at: string | null
          entity_id: string | null
          id: string
          messages: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_picks: {
        Row: {
          amount: number | null
          auto_picked: boolean | null
          draft_session_id: string | null
          id: string
          league_id: string | null
          pick_number: number
          picked_at: string | null
          player_id: number | null
          round: number
          team_id: string | null
        }
        Insert: {
          amount?: number | null
          auto_picked?: boolean | null
          draft_session_id?: string | null
          id?: string
          league_id?: string | null
          pick_number: number
          picked_at?: string | null
          player_id?: number | null
          round: number
          team_id?: string | null
        }
        Update: {
          amount?: number | null
          auto_picked?: boolean | null
          draft_session_id?: string | null
          id?: string
          league_id?: string | null
          pick_number?: number
          picked_at?: string | null
          player_id?: number | null
          round?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_picks_draft_session_id_fkey"
            columns: ["draft_session_id"]
            isOneToOne: false
            referencedRelation: "draft_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_sessions: {
        Row: {
          completed_at: string | null
          current_pick: number | null
          current_round: number | null
          current_team_id: string | null
          id: string
          league_id: string | null
          pick_deadline: string | null
          pick_time_seconds: number | null
          snake_order: string[] | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          current_pick?: number | null
          current_round?: number | null
          current_team_id?: string | null
          id?: string
          league_id?: string | null
          pick_deadline?: string | null
          pick_time_seconds?: number | null
          snake_order?: string[] | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          current_pick?: number | null
          current_round?: number | null
          current_team_id?: string | null
          id?: string
          league_id?: string | null
          pick_deadline?: string | null
          pick_time_seconds?: number | null
          snake_order?: string[] | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_sessions_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_sessions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      gameweek_scores: {
        Row: {
          calculated_at: string | null
          gameweek: number
          id: string
          points: number | null
          rank: number | null
          season: string
          team_id: string | null
        }
        Insert: {
          calculated_at?: string | null
          gameweek: number
          id?: string
          points?: number | null
          rank?: number | null
          season?: string
          team_id?: string | null
        }
        Update: {
          calculated_at?: string | null
          gameweek?: number
          id?: string
          points?: number | null
          rank?: number | null
          season?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gameweek_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string | null
          key: string
          result: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          key: string
          result?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          key?: string
          result?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      league_prizes: {
        Row: {
          badge: string | null
          created_at: string | null
          id: string
          label: string
          league_id: string | null
          rank: number
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          id?: string
          label: string
          league_id?: string | null
          rank: number
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          id?: string
          label?: string
          league_id?: string | null
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_prizes_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          auction_budget: number | null
          commissioner_id: string | null
          created_at: string | null
          draft_mode: string | null
          draft_type: string | null
          id: string
          invite_code: string | null
          max_teams: number | null
          name: string
          roster_size: number | null
          scoring_system: Json | null
          season: string
          settings: Json | null
          status: string | null
          trade_deadline: string | null
          waiver_type: string | null
        }
        Insert: {
          auction_budget?: number | null
          commissioner_id?: string | null
          created_at?: string | null
          draft_mode?: string | null
          draft_type?: string | null
          id?: string
          invite_code?: string | null
          max_teams?: number | null
          name: string
          roster_size?: number | null
          scoring_system?: Json | null
          season?: string
          settings?: Json | null
          status?: string | null
          trade_deadline?: string | null
          waiver_type?: string | null
        }
        Update: {
          auction_budget?: number | null
          commissioner_id?: string | null
          created_at?: string | null
          draft_mode?: string | null
          draft_type?: string | null
          id?: string
          invite_code?: string | null
          max_teams?: number | null
          name?: string
          roster_size?: number | null
          scoring_system?: Json | null
          season?: string
          settings?: Json | null
          status?: string | null
          trade_deadline?: string | null
          waiver_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_commissioner_id_fkey"
            columns: ["commissioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lineups: {
        Row: {
          bench: Json
          captain_player_id: number | null
          chip: string | null
          formation: string
          gameweek: number
          id: string
          league_id: string
          locked_at: string | null
          points: number | null
          season: string
          starters: Json
          team_id: string
          updated_at: string | null
          vice_player_id: number | null
        }
        Insert: {
          bench?: Json
          captain_player_id?: number | null
          chip?: string | null
          formation?: string
          gameweek: number
          id?: string
          league_id: string
          locked_at?: string | null
          points?: number | null
          season?: string
          starters?: Json
          team_id: string
          updated_at?: string | null
          vice_player_id?: number | null
        }
        Update: {
          bench?: Json
          captain_player_id?: number | null
          chip?: string | null
          formation?: string
          gameweek?: number
          id?: string
          league_id?: string
          locked_at?: string | null
          points?: number | null
          season?: string
          starters?: Json
          team_id?: string
          updated_at?: string | null
          vice_player_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lineups_captain_player_id_fkey"
            columns: ["captain_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_vice_player_id_fkey"
            columns: ["vice_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          assists: number | null
          bonus_points: number | null
          clean_sheet: boolean | null
          fantasy_points: number | null
          fixture_id: number
          gameweek: number
          goals: number | null
          id: string
          minutes_played: number | null
          player_id: number | null
          raw_stats: Json | null
          red_cards: number | null
          saves: number | null
          season: string
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          bonus_points?: number | null
          clean_sheet?: boolean | null
          fantasy_points?: number | null
          fixture_id: number
          gameweek: number
          goals?: number | null
          id?: string
          minutes_played?: number | null
          player_id?: number | null
          raw_stats?: Json | null
          red_cards?: number | null
          saves?: number | null
          season?: string
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          bonus_points?: number | null
          clean_sheet?: boolean | null
          fantasy_points?: number | null
          fixture_id?: number
          gameweek?: number
          goals?: number | null
          id?: string
          minutes_played?: number | null
          player_id?: number | null
          raw_stats?: Json | null
          red_cards?: number | null
          saves?: number | null
          season?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number | null
          api_id: number
          club: string
          club_short: string | null
          draft_vor: number | null
          form: number | null
          id: number
          injury_detail: string | null
          injury_risk_score: number | null
          injury_status: string | null
          name: string
          nationality: string | null
          ownership_pct: number | null
          photo_url: string | null
          position: string | null
          predicted_points_next_gw: number | null
          price: number | null
          shirt_number: number | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          api_id: number
          club: string
          club_short?: string | null
          draft_vor?: number | null
          form?: number | null
          id?: number
          injury_detail?: string | null
          injury_risk_score?: number | null
          injury_status?: string | null
          name: string
          nationality?: string | null
          ownership_pct?: number | null
          photo_url?: string | null
          position?: string | null
          predicted_points_next_gw?: number | null
          price?: number | null
          shirt_number?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          api_id?: number
          club?: string
          club_short?: string | null
          draft_vor?: number | null
          form?: number | null
          id?: number
          injury_detail?: string | null
          injury_risk_score?: number | null
          injury_status?: string | null
          name?: string
          nationality?: string | null
          ownership_pct?: number | null
          photo_url?: string | null
          position?: string | null
          predicted_points_next_gw?: number | null
          price?: number | null
          shirt_number?: number | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          favorite_club: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_club?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_club?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      roster_slots: {
        Row: {
          acquired_at: string | null
          acquired_via: string | null
          id: string
          lineup_position: string | null
          player_id: number | null
          slot_type: string | null
          team_id: string | null
        }
        Insert: {
          acquired_at?: string | null
          acquired_via?: string | null
          id?: string
          lineup_position?: string | null
          player_id?: number | null
          slot_type?: string | null
          team_id?: string | null
        }
        Update: {
          acquired_at?: string | null
          acquired_via?: string | null
          id?: string
          lineup_position?: string | null
          player_id?: number | null
          slot_type?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_slots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_slots_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_audit: {
        Row: {
          base_points: number
          breakdown: Json
          created_at: string | null
          final_points: number
          fixture_id: number | null
          gameweek: number
          id: string
          league_id: string | null
          multiplier: number
          player_id: number | null
          source: string
          team_id: string | null
        }
        Insert: {
          base_points?: number
          breakdown?: Json
          created_at?: string | null
          final_points?: number
          fixture_id?: number | null
          gameweek: number
          id?: string
          league_id?: string | null
          multiplier?: number
          player_id?: number | null
          source?: string
          team_id?: string | null
        }
        Update: {
          base_points?: number
          breakdown?: Json
          created_at?: string | null
          final_points?: number
          fixture_id?: number | null
          gameweek?: number
          id?: string
          league_id?: string | null
          multiplier?: number
          player_id?: number | null
          source?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_audit_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_audit_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_audit_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          draft_position: number | null
          gameweek_points: number | null
          id: string
          league_id: string | null
          logo_url: string | null
          rank: number | null
          team_name: string
          total_points: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          draft_position?: number | null
          gameweek_points?: number | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          rank?: number | null
          team_name: string
          total_points?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          draft_position?: number | null
          gameweek_points?: number | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          rank?: number | null
          team_name?: string
          total_points?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_assets: {
        Row: {
          from_team_id: string | null
          id: string
          player_id: number | null
          to_team_id: string | null
          trade_id: string | null
        }
        Insert: {
          from_team_id?: string | null
          id?: string
          player_id?: number | null
          to_team_id?: string | null
          trade_id?: string | null
        }
        Update: {
          from_team_id?: string | null
          id?: string
          player_id?: number | null
          to_team_id?: string | null
          trade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_assets_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_assets_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_assets_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_assets_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          league_id: string | null
          proposing_team_id: string | null
          receiving_team_id: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          league_id?: string | null
          proposing_team_id?: string | null
          receiving_team_id?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          league_id?: string | null
          proposing_team_id?: string | null
          receiving_team_id?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_proposing_team_id_fkey"
            columns: ["proposing_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_receiving_team_id_fkey"
            columns: ["receiving_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      waiver_claims: {
        Row: {
          add_player_id: number
          created_at: string | null
          drop_player_id: number | null
          faab_bid: number
          failure_reason: string | null
          id: string
          league_id: string
          priority: number
          process_at: string | null
          processed_at: string | null
          status: string
          team_id: string
        }
        Insert: {
          add_player_id: number
          created_at?: string | null
          drop_player_id?: number | null
          faab_bid?: number
          failure_reason?: string | null
          id?: string
          league_id: string
          priority?: number
          process_at?: string | null
          processed_at?: string | null
          status?: string
          team_id: string
        }
        Update: {
          add_player_id?: number
          created_at?: string | null
          drop_player_id?: number | null
          faab_bid?: number
          failure_reason?: string | null
          id?: string
          league_id?: string
          priority?: number
          process_at?: string | null
          processed_at?: string | null
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiver_claims_add_player_id_fkey"
            columns: ["add_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_claims_drop_player_id_fkey"
            columns: ["drop_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_claims_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_claims_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_trade: {
        Args: { p_trade_id: string }
        Returns: {
          status: string
        }[]
      }
      get_league_by_invite: {
        Args: { code: string }
        Returns: {
          commissioner_id: string
          draft_mode: string
          draft_type: string
          id: string
          invite_code: string
          max_teams: number
          name: string
          roster_size: number
          season: string
          status: string
        }[]
      }
      user_in_league: { Args: { p_league_id: string }; Returns: boolean }
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
