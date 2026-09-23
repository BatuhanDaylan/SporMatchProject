/**
 * Supabase şema tipleri (elle tutulan, migration'larla senkron).
 *
 * İleride CLI ile otomatik üretilebilir:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * Şimdilik migration'larla elle güncelliyoruz (Faz ilerledikçe genişleyecek).
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          level: SkillLevel | null;
          province: string | null;
          district: string | null;
          goals: string[];
          availability: string[];
          onboarded: boolean;
          pro_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          level?: SkillLevel | null;
          province?: string | null;
          district?: string | null;
          goals?: string[];
          availability?: string[];
          onboarded?: boolean;
          pro_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          level?: SkillLevel | null;
          province?: string | null;
          district?: string | null;
          goals?: string[];
          availability?: string[];
          onboarded?: boolean;
          pro_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_likes: {
        Row: { program_id: string; user_id: string; created_at: string };
        Insert: { program_id: string; user_id: string; created_at?: string };
        Update: { program_id?: string; user_id?: string; created_at?: string };
        Relationships: [];
      };
      program_saves: {
        Row: { program_id: string; user_id: string; created_at: string };
        Insert: { program_id: string; user_id: string; created_at?: string };
        Update: { program_id?: string; user_id?: string; created_at?: string };
        Relationships: [];
      };
      sports: {
        Row: { id: string; name: string; icon: string | null };
        Insert: { id: string; name: string; icon?: string | null };
        Update: { id?: string; name?: string; icon?: string | null };
        Relationships: [];
      };
      user_sports: {
        Row: {
          user_id: string;
          sport_id: string;
          skill_level: SkillLevel | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          sport_id: string;
          skill_level?: SkillLevel | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          sport_id?: string;
          skill_level?: SkillLevel | null;
          created_at?: string;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          sport_id: string | null;
          visibility: 'public' | 'private';
          template: Json;
          forked_from: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          sport_id?: string | null;
          visibility?: 'public' | 'private';
          template?: Json;
          forked_from?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          sport_id?: string | null;
          visibility?: 'public' | 'private';
          template?: Json;
          forked_from?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          day_id: string | null;
          performed_at: string;
          data: Json;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id: string;
          day_id?: string | null;
          performed_at?: string;
          data?: Json;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          program_id?: string;
          day_id?: string | null;
          performed_at?: string;
          data?: Json;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          program_id: string;
          author_id: string;
          parent_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          author_id: string;
          parent_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_id?: string;
          author_id?: string;
          parent_id?: string | null;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      match_sessions: {
        Row: {
          id: string;
          user_id: string;
          sport_ids: string[];
          location: unknown;
          radius_m: number;
          status: 'searching' | 'matched' | 'cancelled' | 'expired';
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport_ids: string[];
          location: unknown;
          radius_m?: number;
          status?: 'searching' | 'matched' | 'cancelled' | 'expired';
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          status?: 'searching' | 'matched' | 'cancelled' | 'expired';
          radius_m?: number;
          expires_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          session_a: string | null;
          session_b: string | null;
          user_a: string;
          user_b: string;
          sport_id: string | null;
          distance_m: number | null;
          a_confirmed: boolean;
          b_confirmed: boolean;
          status: 'pending' | 'confirmed' | 'declined' | 'expired';
          origin: 'match' | 'chat';
          conversation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          origin?: 'match' | 'chat';
          session_a?: string | null;
          session_b?: string | null;
          sport_id?: string | null;
          distance_m?: number | null;
          a_confirmed?: boolean;
          b_confirmed?: boolean;
          status?: 'pending' | 'confirmed' | 'declined' | 'expired';
          conversation_id?: string | null;
          created_at?: string;
        };
        Update: {
          a_confirmed?: boolean;
          b_confirmed?: boolean;
          status?: 'pending' | 'confirmed' | 'declined' | 'expired';
          conversation_id?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: { id: string; match_id: string; created_at: string };
        Insert: { id?: string; match_id: string; created_at?: string };
        Update: { id?: string; match_id?: string; created_at?: string };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      push_tokens: {
        Row: { token: string; user_id: string; platform: string | null; updated_at: string };
        Insert: { token: string; user_id: string; platform?: string | null; updated_at?: string };
        Update: { token?: string; user_id?: string; platform?: string | null; updated_at?: string };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title: string;
          body?: string | null;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      user_blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string; created_at?: string };
        Update: { blocker_id?: string; blocked_id?: string; created_at?: string };
        Relationships: [];
      };
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string };
        Insert: { follower_id: string; following_id: string; created_at?: string };
        Update: { follower_id?: string; following_id?: string; created_at?: string };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          context: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          context?: Json;
          created_at?: string;
        };
        Update: { reason?: string };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          host_id: string;
          sport_id: string | null;
          title: string;
          description: string | null;
          place_name: string | null;
          province: string | null;
          district: string | null;
          starts_at: string;
          capacity: number | null;
          status: 'open' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          sport_id?: string | null;
          title: string;
          description?: string | null;
          place_name?: string | null;
          province?: string | null;
          district?: string | null;
          starts_at: string;
          capacity?: number | null;
          status?: 'open' | 'cancelled';
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          place_name?: string | null;
          starts_at?: string;
          capacity?: number | null;
          status?: 'open' | 'cancelled';
        };
        Relationships: [];
      };
      event_participants: {
        Row: { event_id: string; user_id: string; created_at: string };
        Insert: { event_id: string; user_id: string; created_at?: string };
        Update: { created_at?: string };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          body: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          body?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: { body?: string | null; image_url?: string | null };
        Relationships: [];
      };
      post_reactions: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; created_at?: string };
        Update: { created_at?: string };
        Relationships: [];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          hidden_at: string | null;
          created_at: string;
        };
        Insert: { id?: string; post_id: string; author_id: string; body: string; created_at?: string };
        Update: { body?: string; hidden_at?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_match_session: {
        Args: { p_sport_ids: string[]; p_lat: number; p_lng: number; p_radius_m?: number };
        Returns: Json;
      };
      confirm_match: { Args: { p_match_id: string }; Returns: Json };
      decline_match: { Args: { p_match_id: string }; Returns: undefined };
      get_match_partner: { Args: { p_match_id: string }; Returns: Json };
      expire_stale_sessions: { Args: Record<string, never>; Returns: undefined };
      list_conversations: { Args: Record<string, never>; Returns: Json };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: undefined };
      get_profile_stats: { Args: { p_user_id?: string }; Returns: Json };
      discover_programs: {
        Args: { p_sort?: string; p_period_days?: number; p_limit?: number };
        Returns: Json;
      };
      send_chat_request: { Args: { p_to: string }; Returns: Json };
      list_chat_requests: { Args: Record<string, never>; Returns: Json };
      mark_all_notifications_read: { Args: Record<string, never>; Returns: undefined };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      get_follow_info: { Args: { p_user_id: string }; Returns: Json };
      following_feed: { Args: { p_limit?: number }; Returns: Json };
      leaderboard: { Args: { p_days?: number; p_scope?: string; p_limit?: number }; Returns: Json };
      my_leaderboard_rank: { Args: { p_days?: number; p_scope?: string }; Returns: Json };
      am_i_admin: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: { p_user?: string }; Returns: boolean };
      admin_list_reports: { Args: { p_limit?: number }; Returns: Json };
      admin_set_comment_hidden: { Args: { p_comment_id: string; p_hidden: boolean }; Returns: undefined };
      admin_clear_avatar: { Args: { p_user_id: string }; Returns: undefined };
      admin_set_post_hidden: { Args: { p_post_id: string; p_hidden: boolean }; Returns: undefined };
      admin_set_post_comment_hidden: { Args: { p_comment_id: string; p_hidden: boolean }; Returns: undefined };
      post_detail: { Args: { p_post_id: string }; Returns: Json };
      create_event: {
        Args: {
          p_sport_id: string | null;
          p_title: string;
          p_description: string | null;
          p_lat: number;
          p_lng: number;
          p_place_name: string | null;
          p_province: string | null;
          p_district: string | null;
          p_starts_at: string;
          p_capacity?: number | null;
        };
        Returns: Json;
      };
      nearby_events: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_radius_m?: number;
          p_sport_id?: string | null;
          p_limit?: number;
        };
        Returns: Json;
      };
      event_detail: { Args: { p_event_id: string }; Returns: Json };
      city_events: { Args: { p_province?: string | null; p_limit?: number }; Returns: Json };
      join_event: { Args: { p_event_id: string }; Returns: Json };
      leave_event: { Args: { p_event_id: string }; Returns: Json };
      my_events: { Args: Record<string, never>; Returns: Json };
      workout_heatmap: { Args: { p_user_id: string; p_days?: number }; Returns: Json };
      feed_posts: { Args: { p_limit?: number; p_author?: string | null }; Returns: Json };
      create_challenge: {
        Args: {
          p_title: string;
          p_description: string | null;
          p_metric: string;
          p_goal: number;
          p_sport_id: string | null;
          p_starts_at: string;
          p_ends_at: string;
        };
        Returns: Json;
      };
      challenges_list: { Args: { p_scope?: string; p_limit?: number }; Returns: Json };
      challenge_detail: { Args: { p_challenge: string }; Returns: Json };
      join_challenge: { Args: { p_challenge: string }; Returns: Json };
      leave_challenge: { Args: { p_challenge: string }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
