/**
 * Supabase database types — regenerate with:
 * npx supabase gen types typescript --project-id nvzuljyfwkonanfgkxfr > types/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          favorite_club: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          favorite_club?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          favorite_club?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: number;
          api_id: number;
          name: string;
          photo_url: string | null;
          club: string;
          club_short: string | null;
          position: string | null;
          nationality: string | null;
          age: number | null;
          total_points: number;
          form: string;
          price: string | null;
          ownership_pct: string;
          injury_status: string;
          injury_detail: string | null;
          predicted_points_next_gw: string | null;
          injury_risk_score: string | null;
          draft_vor: string | null;
          shirt_number: number | null;
          updated_at: string;
        };
        Insert: {
          api_id: number;
          name: string;
          photo_url?: string | null;
          club: string;
          club_short?: string | null;
          position?: string | null;
          nationality?: string | null;
          age?: number | null;
          total_points?: number;
          form?: string;
          price?: string | null;
          ownership_pct?: string;
          injury_status?: string;
          injury_detail?: string | null;
          shirt_number?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          invite_code: string | null;
          commissioner_id: string | null;
          draft_type: string | null;
          draft_mode: string | null;
          max_teams: number;
          roster_size: number;
          scoring_system: Json;
          auction_budget: number;
          waiver_type: string;
          trade_deadline: string | null;
          season: string;
          status: string;
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string | null;
          commissioner_id?: string | null;
          draft_type?: string | null;
          draft_mode?: string | null;
          max_teams?: number;
          roster_size?: number;
          scoring_system?: Json;
          auction_budget?: number;
          waiver_type?: string;
          trade_deadline?: string | null;
          season?: string;
          status?: string;
          settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string | null;
          commissioner_id?: string | null;
          draft_type?: string | null;
          draft_mode?: string | null;
          max_teams?: number;
          roster_size?: number;
          scoring_system?: Json;
          auction_budget?: number;
          waiver_type?: string;
          trade_deadline?: string | null;
          season?: string;
          status?: string;
          settings?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          league_id: string;
          user_id: string | null;
          team_name: string;
          logo_url: string | null;
          total_points: number;
          gameweek_points: number;
          rank: number | null;
          draft_position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id?: string | null;
          team_name: string;
          logo_url?: string | null;
          total_points?: number;
          gameweek_points?: number;
          rank?: number | null;
          draft_position?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string | null;
          team_name?: string;
          logo_url?: string | null;
          total_points?: number;
          gameweek_points?: number;
          rank?: number | null;
          draft_position?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      draft_sessions: {
        Row: {
          id: string;
          league_id: string;
          status: string;
          current_pick: number;
          current_round: number;
          current_team_id: string | null;
          pick_deadline: string | null;
          pick_time_seconds: number;
          snake_order: string[] | null;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          status?: string;
          current_pick?: number;
          current_round?: number;
          current_team_id?: string | null;
          pick_deadline?: string | null;
          pick_time_seconds?: number;
          snake_order?: string[] | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          league_id?: string;
          status?: string;
          current_pick?: number;
          current_round?: number;
          current_team_id?: string | null;
          pick_deadline?: string | null;
          pick_time_seconds?: number;
          snake_order?: string[] | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      draft_picks: {
        Row: {
          id: string;
          draft_session_id: string;
          league_id: string | null;
          team_id: string | null;
          player_id: number | null;
          pick_number: number;
          round: number;
          amount: number | null;
          auto_picked: boolean;
          picked_at: string;
        };
        Insert: {
          id?: string;
          draft_session_id: string;
          league_id?: string | null;
          team_id?: string | null;
          player_id?: number | null;
          pick_number: number;
          round: number;
          amount?: number | null;
          auto_picked?: boolean;
          picked_at?: string;
        };
        Update: {
          id?: string;
          draft_session_id?: string;
          league_id?: string | null;
          team_id?: string | null;
          player_id?: number | null;
          pick_number?: number;
          round?: number;
          amount?: number | null;
          auto_picked?: boolean;
          picked_at?: string;
        };
        Relationships: [];
      };
      roster_slots: {
        Row: {
          id: string;
          team_id: string;
          player_id: number | null;
          slot_type: string;
          lineup_position: string | null;
          acquired_via: string;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          player_id?: number | null;
          slot_type?: string;
          lineup_position?: string | null;
          acquired_via?: string;
          acquired_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          player_id?: number | null;
          slot_type?: string;
          lineup_position?: string | null;
          acquired_via?: string;
          acquired_at?: string;
        };
        Relationships: [];
      };
      trades: {
        Row: {
          id: string;
          league_id: string | null;
          proposing_team_id: string | null;
          receiving_team_id: string | null;
          status: string;
          ai_analysis: Json | null;
          expires_at: string;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id?: string | null;
          proposing_team_id?: string | null;
          receiving_team_id?: string | null;
          status?: string;
          ai_analysis?: Json | null;
          expires_at?: string;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string | null;
          proposing_team_id?: string | null;
          receiving_team_id?: string | null;
          status?: string;
          ai_analysis?: Json | null;
          expires_at?: string;
          responded_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          title: string;
          body?: string | null;
          read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string;
          title?: string;
          body?: string | null;
          read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      gameweek_scores: {
        Row: {
          id: string;
          team_id: string | null;
          gameweek: number;
          season: string;
          points: number;
          rank: number | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          team_id?: string | null;
          gameweek: number;
          season?: string;
          points?: number;
          rank?: number | null;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string | null;
          gameweek?: number;
          season?: string;
          points?: number;
          rank?: number | null;
          calculated_at?: string;
        };
        Relationships: [];
      };
      player_match_stats: {
        Row: {
          id: string;
          player_id: number | null;
          fixture_id: number;
          gameweek: number;
          season: string;
          minutes_played: number;
          goals: number;
          assists: number;
          clean_sheet: boolean;
          yellow_cards: number;
          red_cards: number;
          saves: number;
          bonus_points: number;
          fantasy_points: number;
          raw_stats: Json;
        };
        Insert: {
          player_id?: number | null;
          fixture_id: number;
          gameweek: number;
          season?: string;
          minutes_played?: number;
          goals?: number;
          assists?: number;
          clean_sheet?: boolean;
          yellow_cards?: number;
          red_cards?: number;
          saves?: number;
          bonus_points?: number;
          fantasy_points?: number;
          raw_stats?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["player_match_stats"]["Insert"]>;
        Relationships: [];
      };
      trade_assets: {
        Row: {
          id: string;
          trade_id: string;
          player_id: number | null;
          from_team_id: string | null;
          to_team_id: string | null;
        };
        Insert: {
          id?: string;
          trade_id: string;
          player_id?: number | null;
          from_team_id?: string | null;
          to_team_id?: string | null;
        };
        Update: {
          id?: string;
          trade_id?: string;
          player_id?: number | null;
          from_team_id?: string | null;
          to_team_id?: string | null;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string | null;
          context: string;
          entity_id: string | null;
          messages: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          context: string;
          entity_id?: string | null;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          context?: string;
          entity_id?: string | null;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lineups: {
        Row: {
          id: string;
          team_id: string;
          league_id: string;
          gameweek: number;
          season: string;
          formation: string;
          starters: Json;
          bench: Json;
          captain_player_id: number | null;
          vice_player_id: number | null;
          chip: string | null;
          locked_at: string | null;
          points: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          league_id: string;
          gameweek: number;
          season?: string;
          formation?: string;
          starters?: Json;
          bench?: Json;
          captain_player_id?: number | null;
          vice_player_id?: number | null;
          chip?: string | null;
          locked_at?: string | null;
          points?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lineups"]["Insert"]>;
        Relationships: [];
      };
      scoring_audit: {
        Row: {
          id: string;
          league_id: string | null;
          team_id: string | null;
          player_id: number | null;
          gameweek: number;
          fixture_id: number | null;
          base_points: number;
          final_points: number;
          multiplier: string;
          breakdown: Json;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id?: string | null;
          team_id?: string | null;
          player_id?: number | null;
          gameweek: number;
          fixture_id?: number | null;
          base_points?: number;
          final_points?: number;
          multiplier?: string;
          breakdown?: Json;
          source?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scoring_audit"]["Insert"]>;
        Relationships: [];
      };
      idempotency_keys: {
        Row: {
          user_id: string;
          key: string;
          result: Json | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          key: string;
          result?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["idempotency_keys"]["Insert"]>;
        Relationships: [];
      };
      league_prizes: {
        Row: {
          id: string;
          league_id: string | null;
          rank: number;
          label: string;
          badge: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id?: string | null;
          rank: number;
          label: string;
          badge?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["league_prizes"]["Insert"]>;
        Relationships: [];
      };
      waiver_claims: {
        Row: {
          id: string;
          league_id: string;
          team_id: string;
          add_player_id: number;
          drop_player_id: number | null;
          priority: number;
          faab_bid: number;
          status: "pending" | "won" | "lost" | "cancelled" | "failed";
          process_at: string | null;
          processed_at: string | null;
          failure_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          team_id: string;
          add_player_id: number;
          drop_player_id?: number | null;
          priority?: number;
          faab_bid?: number;
          status?: "pending" | "won" | "lost" | "cancelled" | "failed";
          process_at?: string | null;
          processed_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["waiver_claims"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_league_by_invite: {
        Args: { code: string };
        Returns: {
          id: string;
          name: string;
          invite_code: string | null;
          commissioner_id: string | null;
          draft_type: string | null;
          draft_mode: string | null;
          max_teams: number;
          roster_size: number;
          status: string;
          season: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
